import * as awsx from "@pulumi/awsx";
import * as pulumi from "@pulumi/pulumi";
import { ordersDockerImage } from "../images/orders";
import { cluster } from "../cluster";
import { rabbitMQAdminHttpListener, amqpListener } from "./rabbitmq";

export const ordersService = new awsx.classic.ecs.FargateService('fargate-orders', {
    cluster,
    desiredCount: 1,
    waitForSteadyState: false,
    taskDefinitionArgs: {
        container: {
            image: ordersDockerImage.ref,
            cpu: 256,
            memory: 512,
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
                    name: 'OTEL_TRACES_EXPORTER',
                    value: 'otlp',
                },
                {
                    name: 'OTEL_EXPORTER_OTLP_ENDPOINT',
                    value: 'https://otlp-gateway-prod-sa-east-1.grafana.net/otlp',
                },
                {
                    name: 'OTEL_EXPORTER_OTLP_HEADERS',
                    value: 'Authorization=Basic MTI4NTQ0MzpnbGNfZXlKdklqb2lNVFExTlRBeU1TSXNJbTRpT2lKemRHRmpheTB4TWpnMU5EUXpMVzkwWld3dGIyNWliMkZ5WkdsdVp5MWxkbVZ1ZEc4dGJtOWtaV3B6SWl3aWF5STZJbmd6ZVRONk1EWTJPVTR6Ukd4cU9VMHljM1JUVjNaR01TSXNJbTBpT25zaWNpSTZJbkJ5YjJRdGMyRXRaV0Z6ZEMweEluMTk='
                },
                {
                    name: 'OTEL_RESOURCE_ATTRIBUTES',
                    value: 'service.name=orders,service.namespace=eventonodejs,deployment.environment=production',
                },
                {
                    name: 'OTEL_NODE_RESOURCE_DETECTORS',
                    value: 'env,host,os',
                },
                {
                    name: 'OTEL_SERVICE_NAME',
                    value: 'orders',
                },
            ]
        },
    }
})