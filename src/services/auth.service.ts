import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  UpdateCommand 
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';
import { User, } from "../types/user.type";
import {
  hashPassword, 
  comparePassword, 
  generateToken,
  validateRegistrationData,
  validateLoginData,
  logger
} from "../utils/user.utils";


const client = new DynamoDBClient({
  maxAttempts: 3,
  retryMode: 'adaptive'
});

const dynamo = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    convertEmptyValues: false,
    removeUndefinedValues: true,
    convertClassInstanceToMap: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

const tableName = process.env.DYNAMODB_TABLE_NAME;

export const registerUser = async (requestData: unknown): Promise<{ userId: string; message: string }> => {
  if (!tableName) {
    logger.error('DYNAMODB_TABLE_NAME environment variable not set');
    throw new Error('Server configuration error');
  }

  const registrationData = validateRegistrationData(requestData);
  const { email, password } = registrationData;

  logger.info('User registration attempt', { email });

  try {
   
    const { Item } = await dynamo.send(new GetCommand({
      TableName: tableName,
      Key: { email }
    }));

    if (Item) {
      logger.warn('Registration attempt for existing user', { email });
      throw new Error('User with this email already exists');
    }

    const passwordHash = await hashPassword(password);

    const newUser: User = {
      userId: uuidv4(),
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };


    await dynamo.send(new PutCommand({
      TableName: tableName,
      Item: newUser,
      ConditionExpression: 'attribute_not_exists(email)'
    }));

    logger.info('User registered successfully', { userId: newUser.userId, email });

    return {
      userId: newUser.userId,
      message: 'User registered successfully'
    };

  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      logger.warn('Race condition in user registration', { email });
      throw new Error('User with this email already exists');
    }
    
    logger.error('Registration error', { email, error: error.message });
    
    if (error.message.includes('Validation failed') || 
        error.message.includes('already exists')) {
      throw error;
    }
    
    throw new Error('Registration failed. Please try again.');
  }
};

export const loginUser = async (requestData: unknown): Promise<{ token: string; message: string }> => {
  if (!tableName) {
    logger.error('DYNAMODB_TABLE_NAME environment variable not set');
    throw new Error('Server configuration error');
  }

  const loginData = validateLoginData(requestData);
  const { email, password } = loginData;

  logger.info('User login attempt', { email });

  try {
   
    const { Item } = await dynamo.send(new GetCommand({
      TableName: tableName,
      Key: { email }
    }));

    if (!Item) {
      logger.warn('Login attempt for non-existent user', { email });
    
      throw new Error('Invalid email or password');
    }

    const user = Item as User;

    if (user.isActive === false) {
      logger.warn('Login attempt for inactive user', { email, userId: user.userId });
      throw new Error('Account is inactive. Please contact support.');
    }

    const isMatch = await comparePassword(password, user.passwordHash);

    if (!isMatch) {
      logger.warn('Invalid password attempt', { email, userId: user.userId });
      throw new Error('Invalid email or password');
    }
    await dynamo.send(new UpdateCommand({
      TableName: tableName,
      Key: { email },
      UpdateExpression: 'SET updatedAt = :timestamp',
      ExpressionAttributeValues: {
        ':timestamp': new Date().toISOString()
      }
    }));

    const token = generateToken(user.userId, user.email);

    logger.info('User logged in successfully', { userId: user.userId, email });

    return {
      token,
      message: 'Login successful'
    };

  } catch (error: any) {
    logger.error('Login error', { email, error: error.message });
    
    if (error.message.includes('Validation failed') || 
        error.message.includes('Invalid email') ||
        error.message.includes('Account is inactive')) {
      throw error;
    }
    
    throw new Error('Login failed. Please try again.');
  }
};

export const getUserById = async (userId: string): Promise<User | null> => {
  if (!tableName) {
    throw new Error('DYNAMODB_TABLE_NAME environment variable not set');
  }

  try {
 
    logger.info('Get user by ID attempt', { userId });
    return null;
  } catch (error: any) {
    logger.error('Get user error', { userId, error: error.message });
    return null;
  }
};