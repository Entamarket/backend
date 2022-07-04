//Schema for pendingTraders collection

db.createCollection("pendingTraders", {
    validator: {
        $jsonSchema:{
            bsonType: 'object',
            required: ['firstName', 'lastName', 'userName', 'email', 'phoneNumber', 'password', 'createdAt', 'otp', 'isEmailVerified'],
            properties:{
                firstName: {
                    bsonType: 'string',
                    description: `must be a string and it's required`
                },

                lastName: {
                    bsonType: 'string',
                    description: `must be a string and it's required`
                },

                userName: {
                    bsonType: 'string',
                    pattern: '^[a-zA-Z][a-zA-Z0-9-_]+$',
                    description: `must be a string and must start with an alphabet and it's required`  
                },

                email: {
                    bsonType: 'string',
                    pattern: '^[a-zA-Z0-9]+@[a-zA-Z]+\\.[a-z]+$',
                    description: `must be a string and a valid email and it's required`
                },

                phoneNumber: {
                    bsonType: 'string',
                    pattern: '^[0-9]{11}$',
                    description: `must be a string of digits and it must be 11 characters long and it's required`
                },

                password: {
                    bsonType: 'string',
                    pattern: '^[^\s]+$',
                    description: `must be a string without spaces, and it must be 8 to 15 characters long and it's required`
                },

                isEmailVerified: {
                    bsonType: 'bool',
                    description: `must be a boolean`
                },

                otp: {
                    bsonType: 'string',
                    description: `must be a string`
                },

                createdAt: {
                    bsonType: 'date',
                    description: `must be a date`
                }

                
            }
        }
    }
})