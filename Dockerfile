# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Vite/CRA/Next static: asegura que genere carpeta "dist" o "build"
# Para Vite:
RUN npm run build

# ---- serve ----
FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
# Vite genera "dist"; CRA "build". Cambia si tu build usa otra carpeta.
COPY --from=build /app/dist /usr/share/nginx/html
# seguridad/performace
RUN rm -f /etc/nginx/conf.d/example_ssl.conf || true
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
