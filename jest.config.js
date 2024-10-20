module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['<rootDir>/**//*.test.ts'],
    coverageDirectory: './coverage',
    coveragePathIgnorePatterns: ['node_modules', 'src/database', 'src/test', 'src/types'],
    transform: {
        '^.+\\.(ts|tsx)?$': 'ts-jest',
        '^.+\\.(js|jsx)$': 'babel-jest',
    },
    transformIgnorePatterns: ["node_modules/(?!@me/test-package)"],
};
