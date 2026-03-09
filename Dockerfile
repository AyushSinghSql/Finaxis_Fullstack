FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["PlanningAPI/Planning_API.csproj", "PlanningAPI/"]
RUN dotnet restore "PlanningAPI/Planning_API.csproj"

COPY PlanningAPI/ ./PlanningAPI/

WORKDIR "/src/PlanningAPI"
RUN dotnet publish "Planning_API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080

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

RUN mkdir -p /tmp/uploads && chmod -R 777 /tmp/uploads

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Planning_API.dll"]