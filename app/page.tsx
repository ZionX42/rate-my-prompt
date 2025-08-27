import { Section, Container, Grid } from '@/components/layout';

export default function Home() {
  return (
    <>
      <Section className="bg-indigo-50">
        <Container>
          <div className="py-12 md:py-20">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">Prompt Hub</h1>
            <p className="text-xl md:text-2xl text-center max-w-3xl mx-auto">
              The premier platform for discovering, sharing, and rating AI prompts
            </p>
            <div className="mt-8 flex justify-center">
              <a
                href="/prompts"
                className="bg-indigo-600 text-white px-6 py-3 rounded-md font-medium hover:bg-indigo-700 transition"
              >
                Browse Prompts
              </a>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Featured Categories</h2>
          <Grid cols={{ default: 1, sm: 2, md: 3 }} gap={6}>
            {['Code Generation', 'Creative Writing', 'Image Prompts', 'Data Analysis'].map((category) => (
              <div key={category} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <h3 className="text-lg font-semibold mb-2">{category}</h3>
                <p className="text-gray-600">Explore the best prompts for {category.toLowerCase()}</p>
              </div>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section className="bg-gray-50">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Prompt Hub makes it easy to discover, share, and use AI prompts
            </p>
          </div>
          <Grid cols={{ default: 1, md: 3 }} gap={8}>
            <div className="text-center p-4">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Discover</h3>
              <p className="text-gray-600">Browse thousands of prompts rated by the community</p>
            </div>
            <div className="text-center p-4">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Use</h3>
              <p className="text-gray-600">Copy and use prompts with your favorite AI tools</p>
            </div>
            <div className="text-center p-4">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Share</h3>
              <p className="text-gray-600">Submit your own prompts and get feedback</p>
            </div>
          </Grid>
        </Container>
      </Section>
    </>
  );
}
