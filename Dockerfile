FROM python:3.13-slim

WORKDIR /app

COPY pyproject.toml .
RUN pip install uv && uv sync

COPY . .

CMD ["uv", "run", "flask", "run", "--host=0.0.0.0"]
