# 1. Build Stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy the project file using the subfolder path
COPY ["PlanningAPI/Planning_API.csproj", "PlanningAPI/"]
RUN dotnet restore "PlanningAPI/Planning_API.csproj"

# Copy the entire backend folder (which includes your wwwroot/react files)
COPY PlanningAPI/ ./PlanningAPI/

# Build and Publish
WORKDIR "/src/PlanningAPI"
RUN dotnet publish "Planning_API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 2. Final Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080

# Switch to root to install your specific native dependencies
USER root
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

# Create your uploads directory
RUN mkdir -p /tmp/uploads && chmod -R 777 /tmp/uploads

# Copy the published app from the build stage
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Planning_API.dll"]