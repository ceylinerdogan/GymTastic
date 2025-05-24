# GYM-Tastic Test Documentation

This document provides comprehensive information about the testing strategy and implementation for the GYM-Tastic AI-Powered Fitness Coach application.

## Test Plan Overview

The testing strategy follows the requirements outlined in the Software Test Documentation and covers:

1. **Unit Testing** - Individual components and functions
2. **Integration Testing** - API endpoints and data flow
3. **Camera Integration Testing** - Camera permissions and pose detection
4. **Performance Testing** - Response times and system stability
5. **Error Handling** - Network issues and edge cases

## Test Structure

```
__tests__/
├── services/
│   ├── authService.test.js          # Authentication service unit tests
│   └── workoutService.test.js       # Workout management unit tests
├── screens/
│   └── LoginScreen.test.js          # Login screen UI/UX tests
├── components/
│   └── CameraIntegration.test.js    # Camera and pose detection tests
└── integration/
    └── apiIntegration.test.js       # API endpoint integration tests
```

## Running Tests

### Prerequisites

Ensure you have the following installed:
- Node.js (>=18)
- React Native development environment
- Jest testing framework (included in dependencies)

### Test Commands

#### Run All Tests
```bash
npm test
```

#### Unit Tests
Test individual components and services:
```bash
npm run test:unit
```

#### Integration Tests
Test API endpoints and data flow:
```bash
npm run test:integration
```

#### Camera Integration Tests
Test camera functionality and pose detection:
```bash
npm run test:camera
```

#### Coverage Report
Generate test coverage report:
```bash
npm run test:coverage
```

#### Watch Mode
Run tests in watch mode for development:
```bash
npm run test:watch
```

#### CI/CD Pipeline
Run tests for continuous integration:
```bash
npm run test:ci
```

#### Performance Tests
Run performance-specific tests:
```bash
npm run test:performance
```

#### Complete Test Suite
Run all test categories:
```bash
npm run test:all
```

## Test Categories

### 1. Unit Testing

#### Authentication Service Tests (`authService.test.js`)
- **Storage Operations**: User data storage, retrieval, and cleanup
- **User Existence Check**: Validate user accounts and active status
- **Authentication Methods**: Login, Google Auth, Firebase Auth, Registration
- **State Management**: Authentication status, user ID management
- **Error Handling**: Network timeouts, server errors, validation failures

**Coverage Requirements**: 70% minimum for functions, lines, branches, and statements

#### Workout Service Tests (`workoutService.test.js`)
- **Workout Data Management**: CRUD operations for workouts
- **Exercise Tracking**: Session management, set recording, repetition counting
- **History and Analytics**: Workout history, statistics, progress tracking
- **Exercise Library**: Available exercises, categories, details
- **Local Storage**: Caching, offline support, data synchronization
- **Error Handling**: Network issues, validation errors, malformed responses

#### Login Screen Tests (`LoginScreen.test.js`)
- **Component Rendering**: UI elements, navigation links, accessibility
- **Form Validation**: Username/password validation, error messages
- **User Authentication**: Login flow, Google Sign-In integration
- **Navigation**: Screen transitions, route parameters
- **Loading States**: Progress indicators, button states
- **Error Handling**: Network errors, authentication failures

### 2. Integration Testing

#### API Integration Tests (`apiIntegration.test.js`)
- **Authentication Flow**: Complete login process with profile verification
- **Workout Data Flow**: Create workout → start session → record sets → end session
- **Profile Management**: Profile creation, updates, image uploads
- **Error Handling**: Network connectivity, server errors, validation
- **Data Consistency**: Cross-service data validation
- **Performance**: Concurrent requests, caching, large datasets
- **Security**: Authentication headers, unauthorized access, data sanitization

### 3. Camera Integration Testing

#### Camera Integration Tests (`CameraIntegration.test.js`)
- **Camera Permissions**: Request, grant, deny, error handling
- **Device Management**: Camera selection, flip functionality, availability
- **Frame Processing**: Real-time pose detection, error handling, throttling
- **Feedback Display**: Real-time feedback, pose overlays, corrective guidance
- **Session Management**: Exercise tracking, timer, repetition counting
- **Performance**: Frame rate optimization, memory management
- **Error Recovery**: Camera errors, pose detection failures, fallback modes
- **Accessibility**: Voice feedback, screen orientations, control labels

## Performance Requirements

Based on the test plan, the following performance benchmarks must be met:

### Response Time Requirements
- **Pose Detection Processing**: 300-500ms with 10% tolerance
- **API Response Times**: Under 2 seconds for standard requests
- **Camera Frame Processing**: Maintain 30 FPS or lower for stability
- **Real-time Feedback**: Latency increase no more than 10% under peak load

### System Stability
- **Memory Management**: Handle long sessions without memory leaks
- **Error Recovery**: Graceful handling of temporary failures
- **Network Resilience**: Offline support and data synchronization

## Test Data and Mocking

### Mocked Dependencies
- **React Navigation**: Navigation functions and route parameters
- **AsyncStorage**: Local storage operations
- **Camera**: Vision camera functionality and permissions
- **TensorFlow**: Pose detection models and processing
- **Google Sign-In**: Authentication flow
- **Socket.io**: Real-time communication
- **API Client**: HTTP requests and responses

### Test Data Patterns
- **Valid User Data**: Complete profiles with realistic values
- **Invalid Data**: Missing fields, incorrect formats, boundary values
- **Error Scenarios**: Network failures, server errors, permission denials
- **Performance Data**: Large datasets, concurrent operations

## Coverage Requirements

The test plan specifies minimum coverage thresholds:

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Coverage Reports

Coverage reports are generated in multiple formats:
- **Text**: Console output for quick review
- **LCOV**: Machine-readable format for CI/CD integration
- **HTML**: Detailed visual reports in `coverage/` directory

## Continuous Integration

### CI/CD Pipeline Integration

The test suite is designed for automated execution in CI/CD pipelines:

```bash
# Install dependencies
npm ci

# Run linting
npm run lint

# Run complete test suite with coverage
npm run test:ci

# Generate coverage reports
npm run test:coverage
```

### Quality Gates

Tests must pass the following quality gates:
- All unit tests pass
- Integration tests pass
- Coverage thresholds met
- No critical linting errors
- Performance benchmarks satisfied

## Test Environment Setup

### Jest Configuration

The Jest configuration (`jest.config.js`) includes:
- React Native preset
- Custom setup file (`jest.setup.js`)
- Transform ignore patterns for React Native modules
- Coverage collection and reporting
- Module name mapping for path aliases

### Mock Setup

The setup file (`jest.setup.js`) configures:
- React Native Testing Library extensions
- Global mocks for React Native components
- Third-party library mocks
- Test environment configuration
- Global test utilities

## Debugging Tests

### Common Issues and Solutions

1. **Mock Not Working**
   - Verify mock is defined before import
   - Check mock path matches actual module path
   - Ensure mock is cleared between tests

2. **Async Test Failures**
   - Use `await waitFor()` for async operations
   - Wrap state changes in `act()`
   - Increase timeout for slow operations

3. **Component Not Found**
   - Verify `testID` props are set correctly
   - Check component rendering conditions
   - Use `debug()` to inspect rendered output

### Test Debugging Commands

```bash
# Run specific test file
npm test -- LoginScreen.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should handle login"

# Debug mode with verbose output
npm test -- --verbose --no-cache

# Run single test in watch mode
npm test -- --watch LoginScreen.test.js
```

## Best Practices

### Test Writing Guidelines

1. **Descriptive Test Names**: Use clear, specific descriptions
2. **Arrange-Act-Assert**: Structure tests with clear phases
3. **Single Responsibility**: One assertion per test when possible
4. **Mock External Dependencies**: Isolate units under test
5. **Clean Up**: Reset mocks and state between tests

### Performance Testing

1. **Measure Response Times**: Track API and processing latencies
2. **Memory Usage**: Monitor memory consumption during long operations
3. **Concurrent Operations**: Test system behavior under load
4. **Error Recovery**: Verify graceful degradation

### Accessibility Testing

1. **Screen Reader Support**: Test with accessibility labels
2. **Keyboard Navigation**: Verify keyboard-only operation
3. **Color Contrast**: Ensure sufficient contrast ratios
4. **Voice Feedback**: Test audio feedback functionality

## Maintenance and Updates

### Regular Maintenance Tasks

1. **Update Test Data**: Keep test data current with API changes
2. **Review Coverage**: Ensure new features have adequate test coverage
3. **Performance Monitoring**: Track performance metrics over time
4. **Mock Updates**: Update mocks when dependencies change

### Adding New Tests

When adding new features:

1. **Write Tests First**: Follow TDD principles when possible
2. **Update Documentation**: Document new test scenarios
3. **Verify Coverage**: Ensure coverage thresholds are maintained
4. **Integration Points**: Test interactions with existing features

## Troubleshooting

### Common Test Failures

1. **Network Timeouts**: Increase Jest timeout for slow operations
2. **Mock Conflicts**: Clear mocks between test suites
3. **Async Race Conditions**: Use proper async/await patterns
4. **Platform Differences**: Account for iOS/Android variations

### Getting Help

- Review Jest documentation for testing patterns
- Check React Native Testing Library guides
- Consult team documentation for project-specific patterns
- Use debugging tools to inspect test execution

---

This documentation should be updated as the test suite evolves and new testing requirements are identified. 