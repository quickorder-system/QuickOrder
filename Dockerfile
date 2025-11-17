# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of the application source code to the working directory
COPY . .

# Create uploads directory for persistent storage
RUN mkdir -p /app/uploads

# Expose the port the app runs on
EXPOSE 5001

# Define the command to run the application
CMD [ "npm", "start" ]
