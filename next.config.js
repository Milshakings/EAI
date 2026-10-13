/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // La PWA se implementa a mano (public/sw.js + manifest.json) en vez de
  // depender de un plugin de build, para que el proyecto funcione apenas
  // se hace `npm install` sin pasos adicionales de configuración.
};

module.exports = nextConfig;
