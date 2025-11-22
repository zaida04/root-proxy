FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source code and config
COPY tsconfig.json ./
COPY src ./src

# Build the application
RUN npm run build

# Set environment variables
ENV NODE_ENV=production

# Run the application
CMD ["node", "dist/index.js"]

