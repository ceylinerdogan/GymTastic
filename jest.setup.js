import 'react-native-gesture-handler/jestSetup';

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      replace: jest.fn(),
      reset: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn(),
  };
});

// Mock React Navigation Stack
jest.mock('@react-navigation/native-stack', () => {
  const actualStack = jest.requireActual('@react-navigation/native-stack');
  return {
    ...actualStack,
    createNativeStackNavigator: () => ({
      Navigator: ({ children }) => children,
      Screen: ({ children }) => children,
    }),
  };
});

// Mock React Native Animated to fix useAnimatedValue issue
jest.mock('react-native/Libraries/Animated/useAnimatedValue', () => {
  return jest.fn(() => ({
    setValue: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
    stopAnimation: jest.fn(),
    resetAnimation: jest.fn(),
    interpolate: jest.fn(() => ({
      setValue: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    })),
  }));
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock React Native components
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  return Object.setPrototypeOf(
    {
      Alert: {
        alert: jest.fn(),
      },
      Platform: {
        OS: 'ios',
        select: jest.fn((obj) => obj.ios),
      },
      Dimensions: {
        get: jest.fn(() => ({ width: 375, height: 667 })),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
      Keyboard: {
        dismiss: jest.fn(),
        addListener: jest.fn(() => ({ remove: jest.fn() })),
        removeListener: jest.fn(),
        removeAllListeners: jest.fn(),
      },
      BackHandler: {
        addEventListener: jest.fn(() => ({ remove: jest.fn() })),
        removeEventListener: jest.fn(),
        exitApp: jest.fn(),
      },
      Linking: {
        addEventListener: jest.fn(() => ({ remove: jest.fn() })),
        removeEventListener: jest.fn(),
        openURL: jest.fn(() => Promise.resolve()),
        canOpenURL: jest.fn(() => Promise.resolve(true)),
        getInitialURL: jest.fn(() => Promise.resolve(null)),
      },
      KeyboardAvoidingView: (props) => {
        const React = require('react');
        const { children, ...otherProps } = props;
        return React.createElement('KeyboardAvoidingView', otherProps, children);
      },
      PermissionsAndroid: {
        PERMISSIONS: {
          CAMERA: 'android.permission.CAMERA',
        },
        RESULTS: {
          GRANTED: 'granted',
          DENIED: 'denied',
        },
        request: jest.fn(() => Promise.resolve('granted')),
        check: jest.fn(() => Promise.resolve('granted')),
      },
    },
    RN
  );
});

// Mock React Native Linear Gradient
jest.mock('react-native-linear-gradient', () => 'LinearGradient');

// Mock React Native Vector Icons with comprehensive native module prevention
jest.mock('react-native-vector-icons', () => {
  const React = require('react');
  const createIconSet = () => {
    const MockIcon = (props) => React.createElement('Icon', props);
    MockIcon.loadFont = jest.fn(() => Promise.resolve());
    MockIcon.hasIcon = jest.fn(() => true);
    MockIcon.getImageSource = jest.fn(() => Promise.resolve({ uri: 'mock-icon' }));
    MockIcon.getRawImageSource = jest.fn(() => Promise.resolve({ uri: 'mock-icon' }));
    return MockIcon;
  };
  
  return {
    createIconSet,
    createIconSetFromFontello: createIconSet,
    createIconSetFromIcoMoon: createIconSet,
  };
});

// Mock specific vector icon libraries with comprehensive methods
jest.mock('react-native-vector-icons/MaterialIcons', () => {
  const React = require('react');
  const MockIcon = (props) => React.createElement('MaterialIcons', props);
  MockIcon.loadFont = jest.fn(() => Promise.resolve());
  MockIcon.hasIcon = jest.fn(() => true);
  MockIcon.getImageSource = jest.fn(() => Promise.resolve({ uri: 'mock-icon' }));
  MockIcon.getRawImageSource = jest.fn(() => Promise.resolve({ uri: 'mock-icon' }));
  return MockIcon;
});

jest.mock('react-native-vector-icons/FontAwesome', () => {
  const React = require('react');
  const MockIcon = (props) => React.createElement('FontAwesome', props);
  MockIcon.loadFont = jest.fn(() => Promise.resolve());
  MockIcon.hasIcon = jest.fn(() => true);
  MockIcon.getImageSource = jest.fn(() => Promise.resolve({ uri: 'mock-icon' }));
  MockIcon.getRawImageSource = jest.fn(() => Promise.resolve({ uri: 'mock-icon' }));
  return MockIcon;
});

// Mock MaterialCommunityIcons specifically since TabNavigator uses it
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => {
  const React = require('react');
  const MockIcon = (props) => React.createElement('MaterialCommunityIcons', props);
  MockIcon.loadFont = jest.fn(() => Promise.resolve());
  MockIcon.hasIcon = jest.fn(() => true);
  MockIcon.getImageSource = jest.fn(() => Promise.resolve({ uri: 'mock-icon' }));
  MockIcon.getRawImageSource = jest.fn(() => Promise.resolve({ uri: 'mock-icon' }));
  return MockIcon;
});

// Mock the ensure-native-module-available to prevent native module checks
jest.mock('react-native-vector-icons/lib/ensure-native-module-available', () => ({
  ensureNativeModuleAvailable: jest.fn(),
}));

// Mock create-icon-set to prevent native module loading
jest.mock('react-native-vector-icons/lib/create-icon-set', () => {
  const React = require('react');
  return jest.fn(() => {
    const MockIcon = (props) => React.createElement('Icon', props);
    MockIcon.loadFont = jest.fn(() => Promise.resolve());
    MockIcon.hasIcon = jest.fn(() => true);
    MockIcon.getImageSource = jest.fn(() => Promise.resolve({ uri: 'mock-icon' }));
    MockIcon.getRawImageSource = jest.fn(() => Promise.resolve({ uri: 'mock-icon' }));
    return MockIcon;
  });
});

// Mock native RNVectorIcons module
// Removed problematic native module mocks

// Mock Camera
jest.mock('react-native-vision-camera', () => {
  const React = require('react');
  
  const CameraMock = React.forwardRef((props, ref) => {
    const MockCamera = React.createElement('Camera', {
      ...props,
      testID: props.testID || 'camera-view',
      ref
    });
    return MockCamera;
  });
  
  // Add static methods to the Camera component that always grant permission
  CameraMock.getCameraPermissionStatus = jest.fn(() => Promise.resolve('granted'));
  CameraMock.requestCameraPermission = jest.fn(() => Promise.resolve('authorized'));
  CameraMock.getAvailableCameraDevices = jest.fn(() => Promise.resolve([
    { id: 'back', position: 'back' },
    { id: 'front', position: 'front' }
  ]));
  
  return {
    Camera: CameraMock,
    useCameraDevices: jest.fn(() => ({
      back: { id: 'back', position: 'back' },
      front: { id: 'front', position: 'front' },
    })),
    useCameraDevice: jest.fn((type) => ({
      id: type === 'front' ? 'front' : 'back',
      position: type || 'back',
      hasFlash: true,
      hasTorch: true,
      isMultiCam: false,
      supportsDepthCapture: false,
      supportsRawCapture: false,
      supportsFocus: true,
      supportsLowLightBoost: false,
    })),
    useFrameProcessor: jest.fn(() => jest.fn()),
    // Export static methods as well
    getCameraPermissionStatus: jest.fn(() => Promise.resolve('granted')),
    requestCameraPermission: jest.fn(() => Promise.resolve('authorized')),
    getAvailableCameraDevices: jest.fn(() => Promise.resolve([
      { id: 'back', position: 'back' },
      { id: 'front', position: 'front' }
    ])),
  };
});

// Mock Socket.io
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connected: true,
  })),
}));

// Mock socketService
jest.mock('./src/services/socketService', () => ({
  initSocket: jest.fn(() => Promise.resolve()),
  authenticateSocket: jest.fn(() => Promise.resolve()),
  startExerciseSession: jest.fn(() => Promise.resolve()),
  endExerciseSession: jest.fn(() => Promise.resolve()),
  sendPoseData: jest.fn(() => Promise.resolve()),
  sendFrameData: jest.fn(() => Promise.resolve()),
  onPoseData: jest.fn(),
  onFeedback: jest.fn(),
  disconnect: jest.fn(),
  isConnected: jest.fn(() => true),
  getCurrentSessionId: jest.fn(() => 'mock-session-id'),
  getServerInfo: jest.fn(() => ({
    connected: true,
    url: 'mock://localhost:5000',
    sessionId: 'mock-session-id'
  })),
  default: {
    initSocket: jest.fn(() => Promise.resolve()),
    authenticateSocket: jest.fn(() => Promise.resolve()),
    startExerciseSession: jest.fn(() => Promise.resolve()),
    endExerciseSession: jest.fn(() => Promise.resolve()),
    sendPoseData: jest.fn(() => Promise.resolve()),
    sendFrameData: jest.fn(() => Promise.resolve()),
    onPoseData: jest.fn(),
    onFeedback: jest.fn(),
    disconnect: jest.fn(),
    isConnected: jest.fn(() => true),
    getCurrentSessionId: jest.fn(() => 'mock-session-id'),
    getServerInfo: jest.fn(() => ({
      connected: true,
      url: 'mock://localhost:5000',
      sessionId: 'mock-session-id'
    })),
  }
}));

// Mock TensorFlow
jest.mock('@tensorflow/tfjs', () => ({
  ready: jest.fn(() => Promise.resolve()),
  loadLayersModel: jest.fn(),
  tensor: jest.fn(),
}));

jest.mock('@tensorflow-models/pose-detection', () => ({
  createDetector: jest.fn(() => Promise.resolve({
    estimatePoses: jest.fn(() => Promise.resolve([])),
  })),
  SupportedModels: {
    MoveNet: 'MoveNet',
  },
}));

// Mock Google Sign In
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(() => Promise.resolve({
      data: {
        idToken: 'mock-id-token',
        user: {
          email: 'test@example.com',
          name: 'Test User',
          photo: 'http://example.com/photo.jpg',
        },
      },
    })),
    signOut: jest.fn(() => Promise.resolve()),
  },
  GoogleSigninButton: 'GoogleSigninButton',
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}));

// Mock Image Picker
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
  launchCamera: jest.fn(),
}));

// Mock Element Dropdown
jest.mock('react-native-element-dropdown', () => ({
  Dropdown: 'Dropdown',
  SelectCountry: 'SelectCountry',
}));

// Mock React Native FS with proper NativeEventEmitter handling
jest.mock('react-native-fs', () => {
  const MockRNFS = {
    writeFile: jest.fn(() => Promise.resolve()),
    readFile: jest.fn(() => Promise.resolve('')),
    unlink: jest.fn(() => Promise.resolve()),
    exists: jest.fn(() => Promise.resolve(true)),
    mkdir: jest.fn(() => Promise.resolve()),
    readDir: jest.fn(() => Promise.resolve([])),
    stat: jest.fn(() => Promise.resolve({ isFile: () => true, isDirectory: () => false })),
    DocumentDirectoryPath: '/mock/documents',
    CachesDirectoryPath: '/mock/caches',
    TemporaryDirectoryPath: '/mock/temp',
    ExternalDirectoryPath: '/mock/external',
  };
  
  return MockRNFS;
});

// Mock React Native Image Resizer
jest.mock('react-native-image-resizer', () => ({
  createResizedImage: jest.fn(() => Promise.resolve({
    uri: 'file://mock/resized/image.jpg',
    width: 300,
    height: 300,
    size: 50000,
  })),
}));

// Mock React Native NativeEventEmitter to prevent initialization issues
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter', () => {
  return class MockNativeEventEmitter {
    constructor() {}
    addListener = jest.fn(() => ({ remove: jest.fn() }));
    removeListener = jest.fn();
    removeAllListeners = jest.fn();
  };
});

// Silence console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test timeout
jest.setTimeout(30000); 