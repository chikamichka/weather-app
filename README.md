# Advanced Weather Dashboard & Logbook

**Author:** Imene Boukhelkhal

**Date:** October 2025

This is a full-stack weather application built with Next.js that provides real-time weather data, forecasts, and a persistent logbook for saving and reviewing weather records for different locations and date ranges. The project demonstrates a complete CRUD (Create, Read, Update, Delete) system, integration with multiple external APIs, and data export functionalities.

[**Live Demo**](https://weather-app-4cke.vercel.app)


## ✨ Key Features

* **Live Weather Search:**
    * Get current weather conditions and a 5-day forecast for any city in the world.
    * Autocomplete search suggestions for easy location finding.
    * "Use my location" feature for instant weather data based on geolocation.

* **Persistent Weather Logbook (CRUD):**
    * **Create:** Save weather logs for a specific location and date range. The system validates the location and date inputs before saving.
    * **Read:** View a list of all previously saved logs, sorted by creation date.
    * **Update:** The backend API includes an endpoint to update existing logs. (Note: The frontend UI button is currently disabled).
    * **Delete:** Remove any saved log from the database.

* **External API Integrations:**
    * **YouTube:** View a curated list of travel highlight videos relevant to the saved location.
    * **Google Maps:** Instantly open the saved location on Google Maps using its stored coordinates.

* **Data Export:**
    * Export all saved logs from the database into downloadable **JSON** or **CSV** files.

* **Responsive Design:**
    * A modern, dark-themed interface built with Tailwind CSS that is fully responsive and works on both desktop and mobile devices.

## 🛠️ Tech Stack

| Category         | Technology                                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| **Frontend**     | [Next.js](https://nextjs.org/), [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/) |
| **Backend**      | [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)                                          |
| **Database/ORM** | [PostgreSQL](https://www.postgresql.org/), [Prisma](https://www.prisma.io/)                                  |
| **APIs**         | [OpenWeatherMap API](https://openweathermap.org/api), [YouTube Data API v3](https://developers.google.com/youtube/v3) |
| **Deployment**   | [Vercel](https://vercel.com/)  







This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
