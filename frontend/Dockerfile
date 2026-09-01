FROM node:20-alpine AS build

ARG REACT_APP_API_URL=http://localhost:5000
ARG REACT_APP_WS_URL=ws://localhost:5000
ARG REACT_APP_API_KEY=
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_WS_URL=$REACT_APP_WS_URL
ENV REACT_APP_API_KEY=$REACT_APP_API_KEY

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.25-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
