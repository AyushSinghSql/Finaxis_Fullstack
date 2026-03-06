# 1. Build Stage (Needs both .NET SDK and Node.js)
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build

# --- REQUIRED: Install Node.js so 'npm install' can run inside the container ---
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

WORKDIR /src

# Copy EVERYTHING (Both frontend and backend folders) 
# The .csproj needs to see the ../frontend folder to build it
COPY . .

# Restore dependencies
RUN dotnet restore "PlanningAPI/Planning_API.csproj"

# Build and Publish
# This will trigger your <Target Name="BuildFrontend"> because Docker uses Release mode
WORKDIR "/src/PlanningAPI"
RUN dotnet publish "Planning_API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 2. Final Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080

USER root
# Install your specific native dependencies
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

# Copy the published app (which now contains the new React files in wwwroot)
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Planning_API.dll"]