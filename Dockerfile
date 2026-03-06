# --- STAGE 1: Build the React Frontend ---
FROM node:20 AS frontend-build
WORKDIR /src
# Copy frontend files
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- STAGE 2: Build the .NET Backend ---
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy the project file and restore
COPY ["PlanningAPI/Planning_API.csproj", "PlanningAPI/"]
RUN dotnet restore "PlanningAPI/Planning_API.csproj"

# Copy the backend source code
COPY PlanningAPI/ ./PlanningAPI/

# IMPORTANT: Copy the React build from Stage 1 into the Backend's wwwroot
COPY --from=frontend-build /src/dist ./PlanningAPI/wwwroot

# Publish the backend (this now includes the fresh frontend files)
WORKDIR "/src/PlanningAPI"
RUN dotnet publish "Planning_API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# --- STAGE 3: Final Runtime ---
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080

USER root
# Install your native dependencies
RUN apt-get update && apt-get install -y \
    libc6-dev \
    libgdiplus \
    libx11-dev \
    libxrender1 \
    libxtst6 \
    libxi6 \
    libz-dev \
    unzip \
 && ln -s /lib/x86_64-linux-gnu/libdl.so.2 /usr/lib/libdl.so || true \
 && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /tmp/uploads && chmod -R 777 /tmp/uploads

# Copy the published app from the build stage
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Planning_API.dll"]