ARG PARENT_IMAGE=cirss/tro-checks-parent:latest

FROM ${PARENT_IMAGE}

COPY exports /repro/exports

ADD ${REPRO_DIST}/boot-setup /repro/dist/

RUN bash /repro/dist/boot-setup

USER repro

RUN repro.require tro-checks exports --demo --code

RUN repro.require review-ledger main ${CIRSS} --report

# each demo writes its reports into a local directory named tmp
RUN repro.env REPRO_DEMO_TMP_DIRNAME tmp

CMD  /bin/bash -il
