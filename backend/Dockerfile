# syntax=docker/dockerfile:1
# ---- Build stage ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
# Cache dependencies first
COPY pom.xml .
COPY .mvn/ .mvn/
COPY mvnw .
RUN mvn -B -q dependency:go-offline
# Build
COPY src/ src/
RUN mvn -B -q clean package -DskipTests

# ---- Runtime stage ----
FROM eclipse-temurin:21-jre AS runtime
# Bump to a JRE 25 base image once the build targets Java 25.
WORKDIR /app
# Non-root user
RUN groupadd --system app && useradd --system --gid app --home /app app
COPY --from=build --chown=app:app /build/target/grossimarche-api-*.jar /app/app.jar
# Uploaded product images land here (docker-compose mounts a named volume on it, and the
# gateway serves it under /files/). /app belongs to root, so the directory has to exist and
# be owned by `app` up front - otherwise the non-root process cannot create it and every
# upload fails with 500.
RUN mkdir -p /app/data/uploads && chown -R app:app /app/data
USER app
EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=prod
# (No HEALTHCHECK to avoid depending on wget/curl in the slim JRE image; the app's health
# is at /actuator/health. docker-compose overrides the profile to "local".)
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
