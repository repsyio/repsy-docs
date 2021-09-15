FROM klakegg/hugo:0.72.0 AS builder

WORKDIR /src
COPY . /src

RUN wget -q --no-check-certificate https://github.com/matcornic/hugo-theme-learn/archive/2.5.0.tar.gz && \
    rm -rf themes/* && mv 2.5.0.tar.gz themes/ && cd themes && tar xvf 2.5.0.tar.gz && \
    mv hugo-theme-learn-2.5.0 hugo-theme-learn && cd .. && hugo -D

FROM nginx
COPY --from=builder /src/public /usr/share/nginx/html
