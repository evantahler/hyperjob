# Hyperjob
A distributed, file-based job queue cluster
 **VERY WIP** **DO NOT USE**

Basically, we are taking the API of [node-resque](https://github.com/taskrabbit/node-resque), and swapping out redis for hyperdrive.  Hyperjob allows your applications to enqueue work to be done later, by another process.  The canonical example is that a web server asks another "background worker" to send some emails... but there is so much more that can be done!

This will allow for a few super cool things:
* no need for redis
* on-disk persistence for all jobs (which allows introspection by other tools)
* cluster/gossip to more easily add and remove workers

Since we are starting a new project which *will not be compatible with node-resque in any way*, we can do a few things differnty this time:
* "multiworker" by default
* better "worker is dead" vs "worker is working" apis
* append job status to the job, including errors
* job history (via hyperdrive versions)

Based on:
* Hyperdiscovery - https://github.com/karissa/hyperdiscovery
* Hyperdrive - https://github.com/mafintosh/hyperdrive
* Node Resque - https://github.com/taskrabbit/node-resque
