https://youtu.be/0FrMAcJ_gAw

Note : You will need to create database "flask_db" on 1st run.
In psql, ```CREATE DATABASE flask_db;```

https://docs.docker.com/get-started/get-docker/

```bash
docker run d \
name postgres db \
e POSTGRES_USER=myuser \
e POSTGRES_PASSWORD=mypassword \
e POSTGRES_DB=flask_db \
p 5432 5432 \
postgres:17
```
