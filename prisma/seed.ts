import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create provider user
  const providerUser = await prisma.user.upsert({
    where: { email: 'dr.sarah.provider@example.com' },
    update: {
      hashedPassword: await hash('password123!', 12),
      loginAttempts: 0,
      lockedUntil: null,
      isActive: true,
    },
    create: {
      email: 'dr.sarah.provider@example.com',
      firstName: 'Dr. Sarah',
      lastName: 'Provider',
      role: 'PROVIDER',
      hashedPassword: await hash('password123!', 12),
      isActive: true,
    }
  })
  console.log('Created provider user:', providerUser.email)

  // Create client user
  const clientUser = await prisma.user.upsert({
    where: { email: 'john.doe.client@example.com' },
    update: {},
    create: {
      email: 'john.doe.client@example.com',
      firstName: 'John Doe',
      lastName: 'Client',
      role: 'CLIENT',
      hashedPassword: await hash('password123!', 12),
      isActive: true,
    }
  })
  console.log('Created client user:', clientUser.email)

  // Create a journal entry for the client
  const journalEntry = await prisma.journalEntry.upsert({
    where: { 
      id: 'sample-entry-1'
    },
    update: {},
    create: {
      id: 'sample-entry-1',
      title: 'Weekly Health Progress Update - August 2025',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'This week has been challenging but I\'m making steady progress with my treatment plan. I\'ve been following the prescribed medication schedule and noticed some improvements in my energy levels.'
              }
            ]
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Key observations this week:'
              }
            ]
          },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'Sleep quality has improved - averaging 7 hours per night'
                      }
                    ]
                  }
                ]
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'Appetite is gradually returning to normal'
                      }
                    ]
                  }
                ]
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'Exercise tolerance is slowly increasing'
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'I would like to discuss adjusting the timing of my evening medication during our next appointment, as I\'ve noticed it sometimes affects my sleep onset.'
              }
            ]
          }
        ]
      },
      contentHtml: '<p>This week has been challenging but I\'m making steady progress with my treatment plan. I\'ve been following the prescribed medication schedule and noticed some improvements in my energy levels.</p><p>Key observations this week:</p><ul><li><p>Sleep quality has improved - averaging 7 hours per night</p></li><li><p>Appetite is gradually returning to normal</p></li><li><p>Exercise tolerance is slowly increasing</p></li></ul><p>I would like to discuss adjusting the timing of my evening medication during our next appointment, as I\'ve noticed it sometimes affects my sleep onset.</p>',
      status: 'PUBLISHED',
      mood: 7,
      tags: ['progress', 'medication', 'sleep', 'appetite', 'exercise'],
      userId: clientUser.id,
      wordCount: 145,
      publishedAt: new Date(),
    }
  })
  console.log('Created journal entry:', journalEntry.title)

  // Create a share from client to provider
  await prisma.entryShare.upsert({
    where: {
      entryId_providerId_clientId: {
        entryId: journalEntry.id,
        providerId: providerUser.id,
        clientId: clientUser.id,
      }
    },
    update: {},
    create: {
      entryId: journalEntry.id,
      providerId: providerUser.id,
      clientId: clientUser.id,
      scope: 'FULL_ACCESS',
      message: 'Please review my weekly progress and let me know if you have any concerns about the medication timing.',
    }
  })
  console.log('Created entry share with FULL_ACCESS scope')

  console.log('Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })