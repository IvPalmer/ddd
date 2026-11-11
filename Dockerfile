FROM nginx:alpine
COPY . /usr/share/nginx/html
RUN rm -f /usr/share/nginx/html/Dockerfile /usr/share/nginx/html/.gitignore /usr/share/nginx/html/.DS_Store 2>/dev/null || true
EXPOSE 80
