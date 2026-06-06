import React from 'react'
import { vi } from 'vitest'

export const PostHogProvider = ({ children }: { children: React.ReactNode }) =>
  React.createElement(React.Fragment, null, children)

export const usePostHog = () => ({ capture: vi.fn() })
