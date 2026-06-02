#!/bin/bash
set -euo pipefail

PI="pi --agent-team-subagent-skills disabled --no-session"
export PI_SKIP_VERSION_CHECK=1
export PI_CACHE_RETENTION=long

if [[ $# -eq 0 ]]; then
  echo "Error: no question provided." >&2
  echo "Usage: $0 \"your question or task\"" >&2
  exit 1
fi

QUESTION="$*"

. scripts/langfuse.sh
_COUNCIL_TEMPLATE_FILE=$(mktemp)
trap 'rm -f "$_COUNCIL_TEMPLATE_FILE"' EXIT
lf_prompt_get 'council' '.pi/prompts/council.md' > "$_COUNCIL_TEMPLATE_FILE"

COUNCIL_PROMPT="$(python3 -c "
import sys, re
q = sys.argv[1]
q = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', q)
q = q.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
template = open(sys.argv[2]).read()
print(template.replace('<QUESTION>', q))
" "$QUESTION" "$_COUNCIL_TEMPLATE_FILE")"

fmt_time() {
  local s=$1
  [[ $s -lt 0 ]] && s=0
  if [[ $s -lt 60 ]]; then
    printf '%ds' "$s"
  else
    printf '%dm%02ds' $(( s / 60 )) $(( s % 60 ))
  fi
}

if [ -t 1 ]; then
  printf '\033[1;36m▶ council of agents\033[0m\n'
  printf '\033[0;33m  Question: %s\033[0m\n' "$QUESTION"
  printf '\033[0;90m  scouts A+B (v4-flash) → analyst (claude-sonnet-4-6) + critic (gpt-5.5) → synthesizer (gemini-3.5-flash)\033[0m\n\n'

  RESULT_FILE=$(mktemp /tmp/council-result.XXXXXX.txt)
  cleanup() { rm -f "$RESULT_FILE"; }
  trap cleanup EXIT

  printf '%s' "$COUNCIL_PROMPT" | $PI --model "opencode-go/deepseek-v4-pro" > "$RESULT_FILE" 2>&1 &
  PI_PID=$!

  SPINNER_FRAMES=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
  STAGE_LABELS=('scout' 'analyst + critic' 'synthesizer' 'present answer')
  STAGE_MODELS=('v4-flash × 2' 'claude-sonnet-4-6 + gpt-5.5' 'gemini-3.5-flash' '')
  STAGE_DURATIONS=(45 180 90 45)
  STAGE_STARTS=(0 45 225 315)
  NUM_STAGES=4

  for (( i=0; i<NUM_STAGES; i++ )); do
    if [[ -n "${STAGE_MODELS[$i]}" ]]; then
      printf '  \033[0;90m○ [%d/%d] %-18s (%s)\033[0m\033[K\n' \
        $((i+1)) $NUM_STAGES "${STAGE_LABELS[$i]}" "${STAGE_MODELS[$i]}"
    else
      printf '  \033[0;90m○ [%d/%d] %s\033[0m\033[K\n' $((i+1)) $NUM_STAGES "${STAGE_LABELS[$i]}"
    fi
  done

  draw_progress() {
    local elapsed=$1 frame=$2 stage_idx=0
    for (( i=1; i<NUM_STAGES; i++ )); do
      [[ $elapsed -ge ${STAGE_STARTS[$i]} ]] && stage_idx=$i
    done

    printf '\033[%dA' $NUM_STAGES

    for (( i=0; i<NUM_STAGES; i++ )); do
      if [[ $i -lt $stage_idx ]]; then
        printf '  \033[0;32m✓\033[0m \033[0;90m[%d/%d] %s\033[0m\033[K\n' \
          $((i+1)) $NUM_STAGES "${STAGE_LABELS[$i]}"
      elif [[ $i -eq $stage_idx ]]; then
        local stage_elapsed=$(( elapsed - STAGE_STARTS[i] ))
        local stage_remaining=$(( STAGE_DURATIONS[i] - stage_elapsed ))
        [[ $stage_remaining -lt 0 ]] && stage_remaining=0
        local total_remaining=$stage_remaining
        for (( j=i+1; j<NUM_STAGES; j++ )); do
          total_remaining=$(( total_remaining + STAGE_DURATIONS[j] ))
        done
        if [[ -n "${STAGE_MODELS[$i]}" ]]; then
          printf '  \033[1;33m%s\033[0m \033[1m[%d/%d] %-18s\033[0m \033[0;90m(%s)\033[0m  \033[0;33m%s · ~%s left\033[0m\033[K\n' \
            "$frame" $((i+1)) $NUM_STAGES "${STAGE_LABELS[$i]}" \
            "${STAGE_MODELS[$i]}" "$(fmt_time $stage_elapsed)" "$(fmt_time $total_remaining)"
        else
          printf '  \033[1;33m%s\033[0m \033[1m[%d/%d] %-18s\033[0m  \033[0;33m%s · ~%s left\033[0m\033[K\n' \
            "$frame" $((i+1)) $NUM_STAGES "${STAGE_LABELS[$i]}" \
            "$(fmt_time $stage_elapsed)" "$(fmt_time $total_remaining)"
        fi
      else
        local starts_in=$(( STAGE_STARTS[i] - elapsed ))
        [[ $starts_in -lt 0 ]] && starts_in=0
        if [[ -n "${STAGE_MODELS[$i]}" ]]; then
          printf '  \033[0;90m○ [%d/%d] %-18s (%s)  starts in ~%s\033[0m\033[K\n' \
            $((i+1)) $NUM_STAGES "${STAGE_LABELS[$i]}" "${STAGE_MODELS[$i]}" "$(fmt_time $starts_in)"
        else
          printf '  \033[0;90m○ [%d/%d] %-18s  starts in ~%s\033[0m\033[K\n' \
            $((i+1)) $NUM_STAGES "${STAGE_LABELS[$i]}" "$(fmt_time $starts_in)"
        fi
      fi
    done
  }

  START_TS=$SECONDS
  tick=0
  while kill -0 "$PI_PID" 2>/dev/null; do
    draw_progress $(( SECONDS - START_TS )) "${SPINNER_FRAMES[$((tick % ${#SPINNER_FRAMES[@]}))]}"
    sleep 0.1
    (( tick++ )) || true
  done

  wait "$PI_PID"
  EXIT_CODE=$?
  ELAPSED=$(( SECONDS - START_TS ))

  printf '\033[%dA' $NUM_STAGES
  FINAL_IDX=0
  for (( i=1; i<NUM_STAGES; i++ )); do
    [[ $ELAPSED -ge ${STAGE_STARTS[$i]} ]] && FINAL_IDX=$i
  done
  for (( i=0; i<NUM_STAGES; i++ )); do
    if [[ $EXIT_CODE -eq 0 ]] || [[ $i -lt $FINAL_IDX ]]; then
      printf '  \033[0;32m✓\033[0m \033[0;90m[%d/%d] %s\033[0m\033[K\n' \
        $((i+1)) $NUM_STAGES "${STAGE_LABELS[$i]}"
    elif [[ $i -eq $FINAL_IDX ]]; then
      printf '  \033[1;31m✗\033[0m [%d/%d] %s\033[0m\033[K\n' \
        $((i+1)) $NUM_STAGES "${STAGE_LABELS[$i]}"
    else
      printf '  \033[0;90m○ [%d/%d] %s  (skipped)\033[0m\033[K\n' \
        $((i+1)) $NUM_STAGES "${STAGE_LABELS[$i]}"
    fi
  done

  if [[ $EXIT_CODE -ne 0 ]]; then
    printf '\n\033[1;31m  council failed (exit %d)\033[0m\n' "$EXIT_CODE" >&2
    python3 -c "
import sys, re
text = open(sys.argv[1]).read()
sys.stderr.write(re.sub(r'\x1B\[[0-9;?]*[a-zA-Z]', '', text) + '\n')
" "$RESULT_FILE" >&2
    exit "$EXIT_CODE"
  fi

  printf '\n\033[1;32m▶ council answer  \033[0;33m(%s)\033[0m\n\n' "$(fmt_time $ELAPSED)"
  python3 -c "
import sys, re
text = open(sys.argv[1]).read()
print(re.sub(r'\x1B\[[0-9;?]*[a-zA-Z]', '', text))
" "$RESULT_FILE"
else
  printf '%s' "$COUNCIL_PROMPT" | $PI --model "opencode-go/deepseek-v4-pro"
fi
