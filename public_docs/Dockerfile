# Build stage - generate static site
FROM python:3.11-slim as builder

WORKDIR /docs

# Install MkDocs and plugins
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt mkdocs-i18n

# Copy documentation source
COPY mkdocs.yml .
COPY documentation/ documentation/

# Build static site
RUN mkdocs build

# Production stage - serve with nginx
FROM nginx:alpine

# Copy built static files
COPY --from=builder /docs/site /usr/share/nginx/html

# Custom nginx config for SPA-like behavior
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    location / { \
        try_files $uri $uri/ $uri.html /index.html; \
    } \
    \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
