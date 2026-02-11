# Usa uma imagem pronta do PHP com servidor Apache
FROM php:8.2-apache

# Instala extensões necessárias (o cURL já vem, mas garantimos)
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Habilita o mod_rewrite do Apache (bom para URLs amigáveis se precisar)
RUN a2enmod rewrite

# Copia todos os seus arquivos da pasta local para o servidor
COPY . /var/www/html/

# Define a porta que o Render usa (geralmente 80)
EXPOSE 80