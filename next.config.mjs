/** @type {import('next').NextConfig} */
const deploymentUrl = process.env.NEXTAUTH_URL ||
	(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const nextConfig = {
	env: {
		NEXTAUTH_URL: deploymentUrl,
	},
};

export default nextConfig;
