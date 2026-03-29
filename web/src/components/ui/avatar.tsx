import Image from 'next/image'

type Props = {
  name: string
  picture: string
}

const Avatar = ({ name, picture }: Props) => {
  return (
    <div className="flex items-center">
      <Image src={picture} width={48} height={48} className="rounded-full mr-4" alt={name} />
      <div className="font-headline text-sm font-bold text-on-surface">{name}</div>
    </div>
  )
}

export default Avatar
