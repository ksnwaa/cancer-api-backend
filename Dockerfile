# Gunakan Node.js sebagai base image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy semua file dari proyek ke dalam container
COPY . .

# Expose port 3000 (sesuai dengan server Hapi.js)
EXPOSE 3000

# Jalankan aplikasi
CMD ["node", "app.js"]
