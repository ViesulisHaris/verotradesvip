import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Read the test-data-ids.json file
    const filePath = path.join(process.cwd(), 'test-data-ids.json');
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Test data file not found' }, { status: 404 });
    }
    
    // Read file content
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const testData = JSON.parse(fileContent);
    
    return NextResponse.json(testData);
  } catch (error) {
    console.error('Error reading test data:', error);
    return NextResponse.json({ error: 'Failed to read test data' }, { status: 500 });
  }
}