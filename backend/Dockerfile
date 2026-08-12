FROM python:3.12-slim

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    libjpeg-dev \
    zlib1g-dev \
    libssl-dev \
    libffi-dev \
    curl \
 && rm -rf /var/lib/apt/lists/*


COPY requirements.txt .

RUN pip install --upgrade pip


RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /usr/src/app/media

EXPOSE 9212

CMD ["bash", "-c", "python manage.py migrate && python manage.py runserver"]