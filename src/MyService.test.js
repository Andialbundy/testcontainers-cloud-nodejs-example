const { Client } = require('pg');
const { PostgreSqlContainer } = require('@testcontainers/postgresql');

describe('Akustik Produkt Services', () => {
    let postgresContainer;
    let postgresClient;

    beforeAll(async () => {
        // Start PostgreSQL container for database tests
        postgresContainer = await new PostgreSqlContainer("postgres:14-alpine")
            .withDatabase('akustik_test')
            .withUsername('test_user')
            .withPassword('test_password')
            .start();

        // Connect to PostgreSQL
        postgresClient = new Client({
            connectionString: postgresContainer.getConnectionUri(),
        });
        await postgresClient.connect();
    });

    afterAll(async () => {
        if (postgresClient) {
            await postgresClient.end();
        }
        if (postgresContainer) {
            await postgresContainer.stop();
        }
    });

    describe('Database Integration Tests', () => {
        beforeEach(async () => {
            // Clean up test data
            await postgresClient.query('DROP TABLE IF EXISTS users CASCADE');
            await postgresClient.query('DROP TABLE IF EXISTS audio_files CASCADE');
        });

        it('should create and manage user profiles', async () => {
            // Create users table
            await postgresClient.query(`
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    username VARCHAR(100) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Insert test user
            const insertResult = await postgresClient.query(`
                INSERT INTO users (email, username) VALUES ($1, $2) RETURNING id, email, username
            `, ['test@akustik.ch', 'testuser']);

            expect(insertResult.rows).toHaveLength(1);
            expect(insertResult.rows[0].email).toBe('test@akustik.ch');
            expect(insertResult.rows[0].username).toBe('testuser');
            expect(insertResult.rows[0].id).toBeDefined();

            // Verify user can be retrieved
            const selectResult = await postgresClient.query(
                'SELECT * FROM users WHERE email = $1',
                ['test@akustik.ch']
            );

            expect(selectResult.rows).toHaveLength(1);
            expect(selectResult.rows[0].email).toBe('test@akustik.ch');
        });

        it('should handle audio file metadata', async () => {
            // Create users table first
            await postgresClient.query(`
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    username VARCHAR(100) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Create audio_files table
            await postgresClient.query(`
                CREATE TABLE audio_files (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    filename VARCHAR(255) NOT NULL,
                    bpm INTEGER,
                    musical_key VARCHAR(10),
                    genre VARCHAR(50),
                    mood VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Create user first
            const userResult = await postgresClient.query(`
                INSERT INTO users (email, username) VALUES ($1, $2) RETURNING id
            `, ['dj@akustik.ch', 'testdj']);

            const userId = userResult.rows[0].id;

            // Insert audio file with analysis data
            await postgresClient.query(`
                INSERT INTO audio_files (user_id, filename, bpm, musical_key, genre, mood)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                userId,
                'techno_track_001.wav',
                128,
                'Am',
                'Techno',
                'Dark Industrial'
            ]);

            // Query audio files with user join
            const result = await postgresClient.query(`
                SELECT af.*, u.username 
                FROM audio_files af 
                JOIN users u ON af.user_id = u.id 
                WHERE u.email = $1
            `, ['dj@akustik.ch']);

            expect(result.rows).toHaveLength(1);
            expect(result.rows[0].filename).toBe('techno_track_001.wav');
            expect(result.rows[0].bpm).toBe(128);
            expect(result.rows[0].musical_key).toBe('Am');
            expect(result.rows[0].username).toBe('testdj');
        });

        it('should handle transactions for complex operations', async () => {
            // Create both tables
            await postgresClient.query(`
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    username VARCHAR(100) NOT NULL
                )
            `);

            await postgresClient.query(`
                CREATE TABLE audio_files (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    filename VARCHAR(255) NOT NULL,
                    bpm INTEGER
                )
            `);

            await postgresClient.query('BEGIN');

            try {
                // Insert user
                const userResult = await postgresClient.query(`
                    INSERT INTO users (email, username) VALUES ($1, $2) RETURNING id
                `, ['transaction@test.ch', 'txuser']);

                const userId = userResult.rows[0].id;

                // Insert multiple audio files
                await postgresClient.query(`
                    INSERT INTO audio_files (user_id, filename, bpm) VALUES 
                    ($1, $2, $3),
                    ($4, $5, $6),
                    ($7, $8, $9)
                `, [
                    userId, 'track1.wav', 120,
                    userId, 'track2.wav', 125,
                    userId, 'track3.wav', 130
                ]);

                await postgresClient.query('COMMIT');

                // Verify all data was committed
                const audioCount = await postgresClient.query(
                    'SELECT COUNT(*) FROM audio_files WHERE user_id = $1',
                    [userId]
                );

                expect(audioCount.rows[0].count).toBe('3');

            } catch (error) {
                await postgresClient.query('ROLLBACK');
                throw error;
            }
        });
    });

    describe('Service Integration Tests', () => {
        it('should simulate AI service integration', async () => {
            // This test simulates the integration between your services
            // In a real scenario, you'd mock the Gemini API calls

            // Create a mock AI response structure
            const mockDJPromo = {
                clubHype: "Zurich's latest underground weapon drops tonight!",
                poolDescription: "Dark techno masterpiece with rolling basslines and industrial percussion. Perfect for peak time warehouse sets.",
                micShoutout: "Big shout to the crew supporting the Zurich techno scene - this one's for you!",
                targetBpm: "125-130 BPM",
                mixTips: "Transition from a deeper groove, let the kick drive for 8 bars before bringing in the full bass spectrum."
            };

            // Store in database as if it was generated by AI
            await postgresClient.query(`
                CREATE TABLE ai_generated_content (
                    id SERIAL PRIMARY KEY,
                    content_type VARCHAR(50),
                    input_data JSONB,
                    output_data JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            const insertResult = await postgresClient.query(`
                INSERT INTO ai_generated_content (content_type, input_data, output_data)
                VALUES ($1, $2, $3) RETURNING id
            `, [
                'dj_promo',
                JSON.stringify({
                    trackTitle: "Cyber Dreams",
                    artist: "Neural Wave",
                    vibe: "Dark Industrial"
                }),
                JSON.stringify(mockDJPromo)
            ]);

            expect(insertResult.rows[0].id).toBeDefined();

            // Retrieve and verify the stored content
            const result = await postgresClient.query(
                'SELECT * FROM ai_generated_content WHERE content_type = $1',
                ['dj_promo']
            );

            expect(result.rows).toHaveLength(1);
            const outputData = typeof result.rows[0].output_data === 'string' 
                ? JSON.parse(result.rows[0].output_data) 
                : result.rows[0].output_data;
            expect(outputData.clubHype).toContain('Zurich');
            expect(outputData.targetBpm).toContain('125-130');
        });

        it('should test service health checks', async () => {
            // Simulate health check endpoint data
            const healthCheck = {
                database: 'connected',
                redis: 'connected',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            };

            // Store health check data
            await postgresClient.query(`
                CREATE TABLE IF NOT EXISTS health_checks (
                    id SERIAL PRIMARY KEY,
                    service_status JSONB,
                    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            await postgresClient.query(`
                INSERT INTO health_checks (service_status) VALUES ($1)
            `, [JSON.stringify(healthCheck)]);

            // Verify health check was logged
            const result = await postgresClient.query(
                'SELECT * FROM health_checks ORDER BY checked_at DESC LIMIT 1'
            );

            expect(result.rows).toHaveLength(1);
            const status = typeof result.rows[0].service_status === 'string' 
                ? JSON.parse(result.rows[0].service_status) 
                : result.rows[0].service_status;
            expect(status.database).toBe('connected');
        });
    });
});