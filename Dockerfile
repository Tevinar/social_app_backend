# Start from the official Node.js 22 image on a slim Debian base.
FROM node:22-bookworm-slim

# Run all subsequent file operations and commands from /app inside the image.
WORKDIR /app

# Brings package-lock.json and package.json files into the image so they can be used during build.
# Copy only these files first so dependency installation can be cached (if the github workflow allows it).
COPY package*.json ./
# Install dependencies exactly as locked in package-lock.json.
# npm install scripts are required by some dependencies in this backend,
# so we intentionally allow them here.
RUN npm ci

# Copy the rest of the repository into the image after dependencies are installed.
# We intentionally keep `COPY . .` because `.dockerignore` restricts the build 
# context to the files needed for this image.
COPY . .

# Compile the NestJS application into the dist/ directory.
RUN npm run build

# Document that the application listens on port 3000 inside the container.
EXPOSE 3000

# By default, start the compiled backend application when the container launches.
# Use the production start script which is suited for development, 
# staging, and production environments.
CMD ["npm", "run", "start:prod"]
