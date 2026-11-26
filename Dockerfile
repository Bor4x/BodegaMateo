# Imagen base: Nginx ya trae el servidor listo
FROM nginx:alpine

# Configuración del servidor (el bloque `server` del puerto 3000, en nginx.conf)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia del prototipo al directorio que sirve Nginx
COPY index.html dashboard.html inventory.html \
     product-form.html product-success.html \
     movement.html movement-summary.html movement-success.html \
     alerts.html \
     /usr/share/nginx/html/

COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/
COPY assets/ /usr/share/nginx/html/assets/
