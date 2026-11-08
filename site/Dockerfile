FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html sw.js manifest.webmanifest favicon.svg icon-192.png icon-512.png icon-maskable-512.png apple-touch-icon.png /usr/share/nginx/html/
EXPOSE 8080
