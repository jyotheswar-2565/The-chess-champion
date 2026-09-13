import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ImageBackground } from 'react-native';


/* ================= TYPES ================= */
type Piece = string | null;
type Turn = 'w' | 'b';

/* ================= PIECES ================= */
const pieceEmoji: Record<string, string> = {
  wK:'♔', wQ:'♕', wR:'♖', wB:'♗', wN:'♘', wP:'♙',
  bK:'♚', bQ:'♛', bR:'♜', bB:'♝', bN:'♞', bP:'♟',
};

/* ================= BOARD ================= */
const initialBoard: Piece[][] = [
  ['bR','bN','bB','bQ','bK','bB','bN','bR'],
  ['bP','bP','bP','bP','bP','bP','bP','bP'],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  ['wP','wP','wP','wP','wP','wP','wP','wP'],
  ['wR','wN','wB','wQ','wK','wB','wN','wR'],
];

const inBounds = (x:number,y:number)=>x>=0&&x<8&&y>=0&&y<8;
const cloneBoard = (b:Piece[][])=>b.map(r=>[...r]);

/* ================= MAIN ================= */
const MOVE_TIME = 45; // seconds per move

type ChessScreenProps = {
  route: {
    params: {
      boardTheme: 'classic' | 'dark' | 'wood';
    }
  }
};

const ChessScreen: React.FC<ChessScreenProps> = ({ route }) => {
  const { boardTheme } = route.params;
  const size = Dimensions.get('window').width / 10;

  const [board,setBoard] = useState<Piece[][]>(initialBoard);
  const [turn,setTurn] = useState<Turn>('w');
  const [selected,setSelected] = useState<{x:number,y:number}|null>(null);
  const [validMoves,setValidMoves] = useState<{x:number,y:number}[]>([]);
  const [history,setHistory] = useState<Piece[][][]>([]);
  const [redo,setRedo] = useState<Piece[][][]>([]);
  const [gameOver,setGameOver] = useState<{winner:Turn}|null>(null);
  const [check,setCheck] = useState<Turn|null>(null);

  const [whiteTime,setWhiteTime] = useState(MOVE_TIME);
  const [blackTime,setBlackTime] = useState(MOVE_TIME);

  /* ================= TIMER ================= */
  useEffect(()=>{
    if(gameOver) return;

    const timer = setInterval(()=>{
      if(turn==='w'){
        setWhiteTime(v=>{
          if(v <= 1){
            setGameOver({winner:'b'});
            return 0;
          }
          return v-1;
        });
      } else {
        setBlackTime(v=>{
          if(v <= 1){
            setGameOver({winner:'w'});
            return 0;
          }
          return v-1;
        });
      }
    },1000);

    return ()=>clearInterval(timer);
  },[turn,gameOver]);

  const fmt = (t:number) => `${Math.floor(t/60)}:${String(t%60).padStart(2,'0')}`;

  /* ================= BOARD COLORS ================= */
  const getSquareColor = (x: number, y: number, isValid: boolean) => {
    if (isValid) return '#7dd87d';
    const themes = {
      classic: ['#f0d9b5', '#b58863'],
      dark: ['#a0a2a7ff', '#f1f1e7ff'],
      wood: ['#deb887', '#8b4513'],
    };
    const [light, dark] = themes[boardTheme];
    return (x + y) % 2 === 0 ? light : dark;
  };

  /* ================= MOVE LOGIC ================= */
  const getPseudoMoves = (x:number,y:number,b=board) => {
    const p = b[y][x]; if(!p) return [];
    const c = p[0], t = p[1];
    const dir = c==='w'?-1:1;
    const m:{x:number,y:number}[] = [];
    const slide = (dx:number,dy:number)=>{
      let nx=x+dx, ny=y+dy;
      while(inBounds(nx,ny)){
        if(b[ny][nx]){
          if(b[ny][nx]![0]!==c) m.push({x:nx,y:ny});
          break;
        }
        m.push({x:nx,y:ny}); nx+=dx; ny+=dy;
      }
    };

    if(t==='P'){
      const startRow = c==='w'?6:1;
      if(inBounds(x,y+dir) && !b[y+dir][x]) m.push({x,y:y+dir});
      if(y===startRow && inBounds(x,y+dir*2) && !b[y+dir][x] && !b[y+dir*2][x])
        m.push({x,y:y+dir*2});
      [-1,1].forEach(dx=>{
        const nx=x+dx, ny=y+dir;
        if(inBounds(nx,ny) && b[ny][nx] && b[ny][nx]![0]!==c) m.push({x:nx,y:ny});
      });
    }
    if(t==='R') slide(1,0),slide(-1,0),slide(0,1),slide(0,-1);
    if(t==='B') slide(1,1),slide(-1,1),slide(1,-1),slide(-1,-1);
    if(t==='Q') slide(1,0),slide(-1,0),slide(0,1),slide(0,-1),
                slide(1,1),slide(-1,1),slide(1,-1),slide(-1,-1);
    if(t==='N'){
      [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]].forEach(([dx,dy])=>{
        const nx=x+dx, ny=y+dy;
        if(inBounds(nx,ny) && (!b[ny][nx] || b[ny][nx]![0]!==c)) m.push({x:nx,y:ny});
      });
    }
    if(t==='K') [-1,0,1].forEach(dx=>[-1,0,1].forEach(dy=>{
      if(dx||dy){
        const nx=x+dx, ny=y+dy;
        if(inBounds(nx,ny) && (!b[ny][nx] || b[ny][nx]![0]!==c)) m.push({x:nx,y:ny});
      }
    }));
    return m;
  };

  const isKingInCheck = (color:Turn,b:Piece[][]) => {
    let kx=-1,ky=-1;
    b.forEach((r,y)=>r.forEach((p,x)=>{ if(p===`${color}K`){kx=x;ky=y;} }));
    const enemy = color==='w'?'b':'w';
    for(let y=0;y<8;y++)
      for(let x=0;x<8;x++)
        if(b[y][x]?.[0]===enemy)
          if(getPseudoMoves(x,y,b).some(m=>m.x===kx&&m.y===ky)) return true;
    return false;
  };

  const getLegalMoves = (x:number,y:number,b=board) => {
    const p = b[y][x]; if(!p) return [];
    const c = p[0] as Turn;
    return getPseudoMoves(x,y,b).filter(m=>{
      const test = cloneBoard(b);
      test[m.y][m.x] = test[y][x]; test[y][x] = null;
      return !isKingInCheck(c,test);
    });
  };

  const hasAnyLegalMove = (color:Turn,b:Piece[][]) => {
    for(let y=0;y<8;y++)
      for(let x=0;x<8;x++)
        if(b[y][x]?.[0]===color)
          if(getLegalMoves(x,y,b).length) return true;
    return false;
  };

  const endTurnCheck = (next:Turn,b:Piece[][]) => {
    if(isKingInCheck(next,b)){
      setCheck(next);
      if(!hasAnyLegalMove(next,b)) setGameOver({winner:next==='w'?'b':'w'});
    } else setCheck(null);
  };

  /* ================= INTERACTION ================= */
  const onSquarePress = (x:number,y:number) => {
    if(gameOver) return;
    if(selected){
      if(validMoves.some(m=>m.x===x&&m.y===y)){
        const nb = cloneBoard(board);
        setHistory([...history,board]);
        setRedo([]);
        nb[y][x] = nb[selected.y][selected.x];
        nb[selected.y][selected.x] = null;
        setBoard(nb);

        const next = turn==='w'?'b':'w';
        setTurn(next);
        setWhiteTime(next==='w'?MOVE_TIME:whiteTime);
        setBlackTime(next==='b'?MOVE_TIME:blackTime);
        endTurnCheck(next,nb);
      }
      setSelected(null);
      setValidMoves([]);
    } else if(board[y][x]?.[0]===turn){
      setSelected({x,y});
      setValidMoves(getLegalMoves(x,y));
    }
  };

  /* ================= CONTROLS ================= */
  const undo = () => {
    if(!history.length) return;
    const prev = history[history.length-1];
    setRedo([board,...redo]);
    setHistory(history.slice(0,-1));
    setBoard(prev);
    setTurn(turn==='w'?'b':'w');
    setGameOver(null);
    setCheck(null);
    setWhiteTime(MOVE_TIME);
    setBlackTime(MOVE_TIME);
  };

  const redoMove = () => {
    if(!redo.length) return;
    const nextBoard = redo[0];
    setHistory([...history,board]);
    setRedo(redo.slice(1));
    setBoard(nextBoard);
    setTurn(turn==='w'?'b':'w');
  };

  const reset = () => {
    setBoard(initialBoard);
    setTurn('w');
    setSelected(null);
    setValidMoves([]);
    setHistory([]);
    setRedo([]);
    setGameOver(null);
    setCheck(null);
    setWhiteTime(MOVE_TIME);
    setBlackTime(MOVE_TIME);
  };

  const getBarWidth = (time:number) => `${(time/MOVE_TIME)*100}%`;

  /* ================= UI ================= */
  return (
    <View style={styles.container}>
      <Text style={styles.title}>♚ CHESS ARENA</Text>

      <View style={[styles.playerBar, turn==='b' && styles.active]}>
        <View style={[styles.timerBar,{width:getBarWidth(blackTime)}]} />
        <Text style={styles.playerText}>Black ⏱ {fmt(blackTime)}</Text>
      </View>

      {check && <Text style={styles.check}>CHECK!</Text>}

      <View style={{width:size*8,height:size*8}}>
        {board.map((row,y)=>(
          <View key={y} style={{flexDirection:'row'}}>
            {row.map((sq,x)=>{
              const isValid = validMoves.some(m=>m.x===x&&m.y===y);
              return (
                <TouchableOpacity
                  key={x}
                  onPress={()=>onSquarePress(x,y)}
                  style={{
                    width:size,
                    height:size,
                    backgroundColor:getSquareColor(x,y,isValid),
                    borderWidth:selected?.x===x&&selected?.y===y?3:0,
                    borderColor:'red',
                    alignItems:'center',
                    justifyContent:'center',
                  }}>
                  <Text style={{fontSize:size*0.6}}>{sq?pieceEmoji[sq]:''}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <View style={[styles.playerBar, turn==='w' && styles.active]}>
        <View style={[styles.timerBar,{width:getBarWidth(whiteTime)}]} />
        <Text style={styles.playerText}>White ⏱ {fmt(whiteTime)}</Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.btn} onPress={undo}><Text style={styles.btnText}>Undo</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={redoMove}><Text style={styles.btnText}>Redo</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={reset}><Text style={styles.btnText}>Reset</Text></TouchableOpacity>
      </View>

      {gameOver && (
        <View style={styles.overlay}>
          <Text style={styles.gameOver}>GAME OVER</Text>
          <Text style={styles.winner}>{gameOver.winner==='w'?'White':'Black'} Wins</Text>
          <TouchableOpacity style={styles.playAgainBtn} onPress={reset}>
            <Text style={styles.playAgainText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default ChessScreen;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#e7e3dd'},
  title:{fontSize:32,fontWeight:'bold',marginBottom:10},
  check:{color:'red',fontSize:20,marginBottom:5},
  buttons:{flexDirection:'row',marginTop:10},
  btn:{margin:5,padding:10,backgroundColor:'#422c10ff',borderRadius:5,},
  btnText:{color:'#fff',fontWeight:'bold',textAlign:'center',fontSize:16,},
  playerBar:{
    width:'80%',
    height:40,
    padding:10,
    backgroundColor:'#444',
    marginVertical:5,
    borderRadius:6,
    overflow:'hidden',
    marginBottom:30,
    marginTop:30,
  },
  active:{backgroundColor:'#c2a170ff'},
  playerText:{color:'#fff',fontSize:18,textAlign:'center',position:'absolute',width:'100%',marginTop:8,},
  timerBar:{position:'absolute',left:0,top:0,bottom:0,backgroundColor:'#422c10ff',zIndex:0,},
  overlay:{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.75)',alignItems:'center',justifyContent:'center',},
  gameOver:{fontSize:40,color:'#fff',fontWeight:'bold'},
  winner:{fontSize:24,color:'#ffd700',marginTop:10},
  playAgainBtn:{marginTop:20,paddingVertical:12,paddingHorizontal:25,backgroundColor:'#D4AF37',borderRadius:8,},
  playAgainText:{color:'#3E2723',fontWeight:'bold',fontSize:18,textAlign:'center',},
});
