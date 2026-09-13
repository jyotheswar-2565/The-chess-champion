import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  ImageBackground,
  Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;
type BoardTheme = 'classic' | 'dark' | 'wood';

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [selectedBoard, setSelectedBoard] = useState<BoardTheme>('classic');
  const [soundOn, setSoundOn] = useState(true);
  const [rulesVisible, setRulesVisible] = useState(false);

  const glowAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1200, useNativeDriver: false }),
      ])
    ).start();

    // Logo animation
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(logoScale, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
          Animated.timing(logoScale, { toValue: 0.8, duration: 1500, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(logoOpacity, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(logoOpacity, { toValue: 0.6, duration: 1500, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#8D6E63', '#D4AF37'],
  });

  const startGame = () => {
    if (!player1 || !player2) return;
    navigation.navigate('Chess', { player1, player2, boardTheme: selectedBoard });
  };

  const boardThemes: { key: BoardTheme; label: string }[] = [
    { key: 'classic', label: 'Classic' },
    { key: 'dark', label: 'Dark' },
    { key: 'wood', label: 'Wood' },
  ];

  return (
    <ImageBackground
      source={require('../../src/assets/chess1.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <StatusBar barStyle="light-content" />

        {/* --- Top Icons --- */}
        <View style={styles.topIcons}>
          <TouchableOpacity onPress={() => setSoundOn(prev => !prev)}>
            <Text style={styles.icon}>{soundOn ? '🔊' : '🔇'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setRulesVisible(true)}>
            <Text style={styles.icon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* ANIMATED LOGO */}
        <Animated.Text
          style={[styles.logo, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}
        >
          ♚
        </Animated.Text>

        <Text style={styles.title}>CHESS ARENA</Text>
        <Text style={styles.subtitle}>Enter the Battlefield</Text>

        {/* PLAYER NAMES */}
        <TextInput
          placeholder="Player 1 Name"
          placeholderTextColor="#E0D7C6"
          style={styles.input}
          value={player1}
          onChangeText={setPlayer1}
        />

        <TextInput
          placeholder="Player 2 Name"
          placeholderTextColor="#E0D7C6"
          style={styles.input}
          value={player2}
          onChangeText={setPlayer2}
        />

        {/* BOARD THEME SELECTION */}
        <View style={styles.difficultyContainer}>
          {boardThemes.map(item => {
            const selected = selectedBoard === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => setSelectedBoard(item.key)}
                style={[styles.difficultyCircle, selected && styles.difficultySelected]}
              >
                <Text style={[styles.difficultyText, selected && styles.difficultyTextSelected]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* START BUTTON */}
        <Animated.View style={[styles.glowButton, { backgroundColor: glowColor }]}>
          <TouchableOpacity onPress={startGame}>
            <Text style={styles.buttonText}>START GAME</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* --- Rules Modal --- */}
        <Modal
          visible={rulesVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setRulesVisible(false)}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Chess Rules</Text>
              <Text style={styles.modalText}>
                1. Pawns move forward 1 step (2 on first move).{'\n'}
                2. Knights move in L-shape.{'\n'}
                3. Bishops move diagonally.{'\n'}
                4. Rooks move horizontally/vertically.{'\n'}
                5. Queen moves any direction.{'\n'}
                6. King moves one step any direction.{'\n'}
                7. Capture opponent pieces by moving onto them.{'\n'}
                8. Checkmate the opponent's King to win.
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setRulesVisible(false)}
              >
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  topIcons: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  icon: { fontSize: 28 },

  logo: { fontSize: 80, color: '#D4AF37', marginBottom: 10 },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#D4AF37',
    letterSpacing: 4,
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
  },
  subtitle: { color: '#F5F0E6', marginBottom: 25, letterSpacing: 1.5 },

  input: {
    width: '80%',
    backgroundColor: 'rgba(62,39,35,0.85)',
    borderColor: '#D4AF37',
    borderWidth: 2,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    color: '#FFF',
  },

  glowButton: {
    marginTop: 25,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 60,
    shadowColor: '#D4AF37',
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 12,
  },

  buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 3 },

  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 10,
    marginBottom: 10,
  },
  difficultyCircle: {
    width: 70,
    height: 50,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(62,39,35,0.8)',
    marginHorizontal: 5,
  },
  difficultySelected: {
    backgroundColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 10,
  },
  difficultyText: { color: '#F5F0E6', fontWeight: 'bold', letterSpacing: 1 },
  difficultyTextSelected: { color: '#3E2723' },

  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 25,
    width: '85%',
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  modalText: { fontSize: 16, lineHeight: 24 },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeText: { fontSize: 16, fontWeight: 'bold', color: '#3E2723' },
});
