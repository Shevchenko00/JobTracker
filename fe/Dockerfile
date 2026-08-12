FROM node:20-slim

WORKDIR /usr/src/app


COPY package*.json ./
RUN npm install

COPY . .

ENV HOST 0.0.0.0
ENV PORT 5172

EXPOSE 5172

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5172"]
