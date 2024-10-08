import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { PrismaClient } from '@repo/database'
import BoardPageLayout from './page.layout'
import { storage } from '@/lib/firebase/firebaseClient'
import { getDownloadURL, ref } from 'firebase/storage'

const prisma = new PrismaClient()

export default async function BoardPage() {
  const session = await getServerSession()

  if (!session?.user) {
    return redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email ?? undefined,
    },
  })

  if (!user) {
    return redirect('/login')
  }

  const meals = await prisma.meal.findMany({
    where: {
      userId: user.userId,
      isPublic: true,
    },
    include: {
      mealItems: true,
      user: true,
    },
    orderBy: {
      date: 'desc',
    },
  })

  const imageUrls: Record<string, string> = {}

  for (const meal of meals) {
    const mealImageRef = ref(storage, `images/${meal.mealItems[0].imageName}`)
    const mealImageUrl = await getDownloadURL(mealImageRef)
    imageUrls[meal.mealId] = mealImageUrl
  }

  return <BoardPageLayout meals={meals} imageUrls={imageUrls} />
}
