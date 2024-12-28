# Construction Industry Website Research CMS

A specialized Content Management System designed to research and analyze construction industry service companies' web presence, identifying potential clients for website redesign services using WordPress themes.

## Overview

This application helps identify and analyze construction industry service companies that could benefit from a website redesign. It scrapes and analyzes company websites, storing relevant information to help identify potential clients for web development services.

## Features

- Web scraping of construction industry service companies
- Analysis of website content and structure
- Storage of company information including:
  - Company name
  - Website URL
  - Business location (City, State, ZIP)
  - Services offered
  - Website content analysis
  - Contact information

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- Supabase (for local development)

### Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd [your-repo-name]
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. Start the local Supabase instance:
```bash
supabase start
```

5. Push the database schema:
```bash
npx prisma db push
```

### Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## Database Management

View and manage your database using Supabase Studio:
```bash
supabase studio
```

## Technology Stack

- **Frontend**: React with Vite
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Prisma ORM
- **Development Tools**: Supabase for local development
- **Web Scraping**: Axios, Cheerio
- **Content Processing**: OpenAI API for content analysis

## Project Goals

1. **Research**: Identify construction industry service companies needing website updates
2. **Analysis**: Evaluate current website status and improvement opportunities
3. **Lead Generation**: Create a database of potential clients for WordPress website development
4. **Service Offering**: Prepare tailored WordPress solutions using industry-specific themes

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details