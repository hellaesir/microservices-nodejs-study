import * as awsx from "@pulumi/awsx";
import * as pulumi from "@pulumi/pulumi";
import { ordersDockerImage } from "../images/orders";
import { cluster } from "../cluster";
import { rabbitMQAdminHttpListener, amqpListener } from "./rabbitmq";
import { appLoadBalancer } from "../load-balancer";


const ordersAdminTargetGroup = appLoadBalancer.createTargetGroup('orders-target', {
    port: 3333,
    protocol: 'HTTP',
    healthCheck: {
        path: '/health',
        protocol: 'HTTP'
    }
})

export const ordersAdminHttpListener = appLoadBalancer.createListener('orders-listener', {
    port: 3333,
    protocol: 'HTTP',
    targetGroup: ordersAdminTargetGroup,
})


export const ordersService = new awsx.classic.ecs.FargateService('fargate-orders', {
    cluster,
    desiredCount: 1,
    waitForSteadyState: false,
    taskDefinitionArgs: {
        container: {
            image: ordersDockerImage.ref,
            cpu: 256,
            memory: 512,
            portMappings: [ordersAdminHttpListener],
            environment: [
                {
                    name: 'BROKER_URL',
                    value: pulumi.interpolate`amqp://admin:admin@${amqpListener.endpoint.hostname}:${amqpListener.endpoint.port}`
                },
                {
                    name: 'DATABASE_URL',
                    value: 'postgresql://orders_owner:npg_ZAtzVIFbg75u@ep-crimson-thunder-a45qvy8g.us-east-1.aws.neon.tech/orders?sslmode=require'
                },
                {
                    name: "OTEL_TRACES_EXPORTER",
                    value: "otlp"
                },
                {
                    name: "OTEL_EXPORTER_OTLP_ENDPOINT",
                    value: "https://otlp-gateway-prod-sa-east-1.grafana.net/otlp"
                },
                {
                    name: "OTEL_EXPORTER_OTLP_HEADERS",
                    value: "Authorization=Basic MTI4NjY4MTpnbGNfZXlKdklqb2lNVFExTmpFMk5DSXNJbTRpT2lKbGRtVnVkRzh0Ym05a1pXcHpJaXdpYXlJNklrdGhNR1l4ZFhZNWNFZDRNVEI2T1c4NFdEZHFOakpSUXlJc0ltMGlPbnNpY2lJNkluQnliMlF0YzJFdFpXRnpkQzB4SW4xOQ=="
                },
                {
                    name: "OTEL_SERVICE_NAME",
                    value: "orders"
                },
                {
                    name: "OTEL_RESOURCE_ATTRIBUTES",
                    value: "service.name=orders,service.namespace=eventonodejs,deployment.environment=production"
                },
                {
                    name: "OTEL_NODE_RESOURCE_DETECTORS",
                    value: "env,host,os"
                },
                {
                    name: 'OTEL_NODE_ENABLED_INSTRUMENTATIONS',
                    value: 'http,fastify,pg,amqplib'
                }
                // {
                //     name: 'OTEL_TRACES_EXPORTER',
                //     value: 'otlp',
                // },
                // {
                //     name: 'OTEL_EXPORTER_OTLP_ENDPOINT',
                //     value: 'https://otlp-gateway-prod-sa-east-1.grafana.net/otlp',
                // },
                // {
                //     name: 'OTEL_EXPORTER_OTLP_HEADERS',
                //     value: 'Authorization=Basic MTI4NTQ0MzpnbGNfZXlKdklqb2lNVFExTlRBeU1TSXNJbTRpT2lKMFpYTjBaU0lzSW1zaU9pSnJRelEyVFRRNWFqWkZRblJDTjBsT1prVm9NRGM1VlRjaUxDSnRJanA3SW5JaU9pSndjbTlrTFhOaExXVmhjM1F0TVNKOWZRPT0='
                // },
                // {
                //     name: 'OTEL_RESOURCE_ATTRIBUTES',
                //     value: 'service.name=teste,service.namespace=teste,deployment.environment=production',
                // },
                // {
                //     name: 'OTEL_NODE_RESOURCE_DETECTORS',
                //     value: 'env,host,os',
                // },
                // {
                //     name: 'OTEL_SERVICE_NAME',
                //     value: 'orders',
                // },
                // {
                //     name: 'OTEL_NODE_ENABLED_INSTRUMENTATIONS',
                //     value: 'http,fastify,pg,amqplib',
                // },
            ]
        },
    }
})