export default function Home() {
  return (
    <main className='min-h-screen p-8'>
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-4xl font-bold mb-8'>
          GitHub Actions Approval Flow Demo
        </h1>

        <div className='space-y-6'>
          <section className='border rounded-lg p-6'>
            <h2 className='text-2xl font-semibold mb-4'>Deployment Flow</h2>
            <ol className='list-decimal list-inside space-y-2'>
              <li>更新Code pushed to main branch or PR created</li>
              <li>Automated build and tests run</li>
              <li>For PRs: Deploy to preview environment</li>
              <li>For main: Wait for manual approval</li>
              <li>After approval: Deploy to production</li>
            </ol>
          </section>

          <section className='border rounded-lg p-6'>
            <h2 className='text-2xl font-semibold mb-4'>Environment Variables</h2>
            <ul className='list-disc list-inside space-y-1'>
              <li>VERCEL_TOKEN</li>
              <li>VERCEL_ORG_ID</li>
              <li>VERCEL_PROJECT_ID</li>
            </ul>
          </section>

          <section className='border rounded-lg p-6'>
            <h2 className='text-2xl font-semibold mb-4'>Current Environment</h2>
            <p>Build Time: {new Date().toISOString()}</p>
            <p>Node Version: {process.version}</p>
          </section>
        </div>
      </div>
    </main>
  )
}
