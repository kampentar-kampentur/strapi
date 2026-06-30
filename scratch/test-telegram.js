const { createStrapi } = require('@strapi/strapi');

async function main() {
  const app = createStrapi();
  await app.load();
  
  console.log('Strapi loaded, creating test technician application...');
  
  const testData = {
    name: 'John Doe',
    phone: '+1 (555) 019-2834',
    email: 'john.doe@example.com',
    city: 'Austin',
    workAuth: 'Yes',
    over18: 'Yes',
    driverLicense: 'Yes',
    languages: 'English, Spanish',
    experienceLevel: '2+ years',
    previousWork: 'Previous handy services inc.',
    servicesPerformed: 'TV Mounting, Soundbar setup',
    hasTools: 'Yes',
    q1Studs: '16 inches',
    q2Power: 'Use in-wall rated cables only',
    schedule: 'Full-time',
    daysPerWeek: '5 days',
    drivingRange: 'Yes',
    desiredIncome: '1500',
    insurance: 'Yes',
    backgroundCheck: 'Yes',
    about: 'Experienced handyman looking for technician role.',
    strengths: 'Fast, accurate, polite.',
    weaknesses: 'Perfectionist.',
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'careers_search',
    gclid: 'gclid_test_12345'
  };

  const result = await app.documents('api::technician-application.technician-application').create({
    data: testData
  });

  console.log('Created application entry:', result);
  console.log('Check your Telegram bot chat for a notification.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
