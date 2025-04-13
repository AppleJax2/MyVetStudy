import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding...`);

  // Create a default practice
  const practice = await prisma.practice.upsert({
    where: { id: 'default-practice-id' },
    update: {},
    create: {
      id: 'default-practice-id',
      name: 'Demo Veterinary Practice',
      address: '123 Vet Street, Animal City, AC 12345',
      phone: '(555) 123-4567',
      email: 'info@demovetpractice.com',
      subscriptionTier: 'TRIAL',
      subscriptionStatus: 'TRIAL',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      maxStorage: 500, // Trial gets Premium storage
    },
  });

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'PRACTICE_OWNER',
      practiceId: practice.id,
    },
  });

  // Create vet user
  const vetPassword = await bcrypt.hash('Vet123!', 10);
  const vet = await prisma.user.upsert({
    where: { email: 'vet@example.com' },
    update: {},
    create: {
      email: 'vet@example.com',
      password: vetPassword,
      firstName: 'Veterinarian',
      lastName: 'Doctor',
      role: 'VETERINARIAN',
      practiceId: practice.id,
    },
  });

  // Create tech user
  const techPassword = await bcrypt.hash('Tech123!', 10);
  const tech = await prisma.user.upsert({
    where: { email: 'tech@example.com' },
    update: {},
    create: {
      email: 'tech@example.com',
      password: techPassword,
      firstName: 'Veterinary',
      lastName: 'Technician',
      role: 'TECHNICIAN',
      practiceId: practice.id,
    },
  });

  // Create sample patients
  const patient1 = await prisma.patient.upsert({
    where: { id: 'sample-patient-1' },
    update: {},
    create: {
      id: 'sample-patient-1',
      name: 'Max',
      species: 'Dog',
      breed: 'Labrador Retriever',
      age: 5,
      weight: 32.5,
      sex: 'MALE',
      practiceId: practice.id,
      createdById: admin.id,
      ownerName: 'John Smith',
      ownerEmail: 'john.smith@example.com',
      ownerPhone: '(555) 987-6543',
    },
  });

  const patient2 = await prisma.patient.upsert({
    where: { id: 'sample-patient-2' },
    update: {},
    create: {
      id: 'sample-patient-2',
      name: 'Luna',
      species: 'Cat',
      breed: 'Maine Coon',
      age: 3,
      weight: 5.2,
      sex: 'FEMALE',
      practiceId: practice.id,
      createdById: vet.id,
      ownerName: 'Sarah Johnson',
      ownerEmail: 'sarah.j@example.com',
      ownerPhone: '(555) 456-7890',
    },
  });

  // Create a sample study
  const study = await prisma.study.upsert({
    where: { id: 'sample-study-1' },
    update: {},
    create: {
      id: 'sample-study-1',
      title: 'Canine Arthritis Treatment Efficacy',
      description: 'A study to evaluate the efficacy of new arthritis treatment in dogs',
      practiceId: practice.id,
      createdById: vet.id,
      status: 'ACTIVE',
      startDate: new Date(),
      protocol: {
        duration: '12 weeks',
        checkupFrequency: 'Weekly',
        objectives: [
          'Measure mobility improvement',
          'Track pain levels',
          'Monitor side effects'
        ]
      },
    },
  });

  // Assign users to the study
  await prisma.studyAssignment.upsert({
    where: { 
      studyId_userId: {
        studyId: study.id,
        userId: vet.id
      }
    },
    update: {},
    create: {
      studyId: study.id,
      userId: vet.id,
      role: 'LEAD_RESEARCHER',
    },
  });

  await prisma.studyAssignment.upsert({
    where: { 
      studyId_userId: {
        studyId: study.id,
        userId: tech.id
      }
    },
    update: {},
    create: {
      studyId: study.id,
      userId: tech.id,
      role: 'ASSISTANT',
    },
  });

  // Enroll patient in the study
  const studyPatient = await prisma.studyPatient.upsert({
    where: {
      studyId_patientId: {
        studyId: study.id,
        patientId: patient1.id
      }
    },
    update: {},
    create: {
      studyId: study.id,
      patientId: patient1.id,
    },
  });

  // Create symptom templates
  const painTemplate = await prisma.symptomTemplate.upsert({
    where: { id: 'pain-level-template' },
    update: {},
    create: {
      id: 'pain-level-template',
      name: 'Pain Level',
      description: 'Observed pain level during activity',
      category: 'Pain Assessment',
      dataType: 'SCALE',
      minValue: 0,
      maxValue: 10,
      studyId: study.id,
    },
  });

  const mobilityTemplate = await prisma.symptomTemplate.upsert({
    where: { id: 'mobility-template' },
    update: {},
    create: {
      id: 'mobility-template',
      name: 'Mobility Score',
      description: 'Overall mobility assessment',
      category: 'Mobility',
      dataType: 'ENUMERATION',
      options: ['POOR', 'FAIR', 'GOOD', 'EXCELLENT'],
      studyId: study.id,
    },
  });

  // Create treatment template
  const treatmentTemplate = await prisma.treatmentTemplate.upsert({
    where: { id: 'arthritis-med-template' },
    update: {},
    create: {
      id: 'arthritis-med-template',
      name: 'Arthritis Medication',
      description: 'Standard treatment for canine arthritis',
      protocol: {
        frequency: 'Twice daily',
        duration: '12 weeks',
        notes: 'Administer with food'
      },
      studyId: study.id,
    },
  });

  // Add sample observations
  await prisma.observation.upsert({
    where: { id: 'sample-observation-1' },
    update: {},
    create: {
      id: 'sample-observation-1',
      symptomTemplateId: painTemplate.id,
      patientId: patient1.id,
      studyPatientId: studyPatient.id,
      recordedById: tech.id,
      recordedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      value: 7, // High pain level initially
      notes: 'Patient showing signs of discomfort during examination',
    },
  });

  await prisma.observation.upsert({
    where: { id: 'sample-observation-2' },
    update: {},
    create: {
      id: 'sample-observation-2',
      symptomTemplateId: mobilityTemplate.id,
      patientId: patient1.id,
      studyPatientId: studyPatient.id,
      recordedById: tech.id,
      recordedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      value: 'POOR',
      notes: 'Difficulty walking, especially on inclines',
    },
  });

  // Add a treatment administration
  await prisma.treatment.upsert({
    where: { id: 'sample-treatment-1' },
    update: {},
    create: {
      id: 'sample-treatment-1',
      templateId: treatmentTemplate.id,
      patientId: patient1.id,
      studyPatientId: studyPatient.id,
      createdById: tech.id,
      administeredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      name: 'Arthritis Medication - Initial Dose',
      dosage: '10mg',
      notes: 'First dose administered under supervision',
    },
  });

  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }); 