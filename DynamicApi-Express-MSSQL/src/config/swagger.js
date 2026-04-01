const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dynamic API Express',
      version: '1.0.0',
      description: 'A dynamic API for executing stored procedures without authentication. Execute any allowed stored procedure with flexible parameters.',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development Server - Local MySQL Database'
      },
      {
        url: 'http://localhost:8080',
        description: 'Production Server'
      }
    ],
    components: {
      schemas: {
        DynamicApiExecuteRequest: {
          type: 'object',
          required: ['stringFour'],
          properties: {
            stringOne: {
              type: 'string',
              description: 'Parameter values in key=value format. Multiple parameters separated by stringTwo. Example: p_ProductId=1|p_Category=Mobile',
              nullable: true,
              example: 'p_ProductId=1|p_Category=Electronics',
              default: ''
            },
            stringTwo: {
              type: 'string',
              description: 'Separator between parameters (default: |)',
              default: '|',
              example: '|'
            },
            stringThree: {
              type: 'string',
              description: 'Separator between key and value (default: =)',
              default: '=',
              example: '='
            },
            stringFour: {
              type: 'string',
              description: 'Name of the stored procedure to execute',
              example: 'GetProductById',
              minLength: 1,
              maxLength: 255
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'boolean',
              description: 'Whether the request succeeded',
              example: true
            },
            message: {
              type: 'string',
              description: 'Response message describing the result',
              example: 'Success'
            },
            data: {
              type: 'array',
              description: 'Returned data from the procedure (array of objects)',
              items: {
                type: 'object',
                additionalProperties: true
              },
              nullable: true,
              example: [
                {
                  'ProductId': 1,
                  'ProductName': 'Laptop',
                  'Price': 50000
                }
              ]
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error description'
            },
            data: {
              type: 'null',
              example: null
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/**/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
