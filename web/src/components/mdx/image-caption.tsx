import Image from 'next/image'

type Props = {
  src: string
  alt: string
  caption: string
}

export function ImageCaption({ src, alt, caption }: Props) {
  return (
    <figure className="my-12">
      <div className="relative w-full overflow-hidden rounded-xl shadow-md">
        <Image
          src={src}
          alt={alt}
          width={1200}
          height={675}
          className="h-auto w-full object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 980px"
        />
      </div>
      <figcaption className="mt-3 text-center text-sm italic text-[#595c5e]">{caption}</figcaption>
    </figure>
  )
}
