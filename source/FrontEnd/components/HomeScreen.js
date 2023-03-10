import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, ScrollView, Text, TextInput, Pressable, Dimensions, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import openURL from './functions/openURL';
import FindWithTags from './functions/FindWithTags';
import isLastestNotice from './functions/isLastestNotice';

const STORAGE_KEYWORD = '@keyword';
const STORAGE_BOOKMARK = '@bookmark';
const { height:SCREEN_HEIGHT, width:SCREEN_WIDTH } = Dimensions.get('window');

function Item({ title, author, date, link, tagged, marked, id }) {
  return (
    <Pressable onPress={() => openURL(link)} onLongPress={()=>{page === 0 ? (addBookMarkAlert({ title, author, date, link })) : (delBookMarkAlert(id))}}>
      <View style={styles.item}>
        <View style={{margin:10, flexDirection:'row', justifyContent:'space-between'}}>
          <Text style={tagged?styles.itemTaggedText:styles.itemText}>{title}</Text>
          {marked && isLastestNotice(date) && <Text style={{color:'tomato', fontSize:8, width:10}}>●</Text>}
        </View>
        <View style={{flexDirection:'row', justifyContent:"space-between", borderTopWidth:1, borderTopColor:'#eee'}}>
          <Text style={{margin:10, color:'#555'}}>{author}</Text>
          <Text style={{margin:10, color:'#aaa'}}>{date}</Text>
        </View>
      </View>
    </Pressable>
  )
}

export default function HomeScreen({ navigation }) {
  const [keyword, setKeyword] = useState('');
  [page, setPage] = useState(0);
  const [pressed, setPressed] = useState(0);
  const [notices, setNotices] = useState([]);
  const [allNotices, setAllNotices] = useState([]);
  const [bookmarks, setBookMarks] = useState({});
  const [tags, setTags] = useState({});
  const [taggedNotices, setTaggedNotices] = useState([]);

  const getNotice = async () => {
    const response = await fetch('https://port-0-pnu-notice-api-1luhct24lcvwvdvb.gksl2.cloudtype.app/notice');
    const json = await response.json();
    setAllNotices(json);
    setNotices(json);
  };
  useEffect(()=> {
    getNotice();
    loadTags();
  }, []);

  const initKeyword = () => { changeKeyword(''); };
  const changeKeyword = (keyword) => { setKeyword(keyword); };
  const search = () => { setNotices(FindWithTags(allNotices, { 'key':{'text':keyword} })); };
  useEffect(search, [ keyword ]);

  //bookmarks
  const addBookMark = async(text) => {
    const newBookMark = {...bookmarks, [Date.now()]: { text }};
    setBookMarks(newBookMark);
    await saveBookMark(newBookMark);
  }
  const deleteBookMark = async (key) => {
    const newBookMark = {...bookmarks};
    delete newBookMark[key];
    setBookMarks(newBookMark);
    await saveBookMark(newBookMark);
  };
  const saveBookMark = async (toSave) => {
    try {
      await AsyncStorage.setItem(STORAGE_BOOKMARK, JSON.stringify(toSave));
    } catch (e) {
      Alert.alert(e.message);
    }
  }
  const loadBookMarks = async () => {
    try {
      const s = await AsyncStorage.getItem(STORAGE_BOOKMARK);
      s !== null ? setBookMarks(JSON.parse(s)) : null;
    } catch (e) {
      Alert.alert(e.message);
    }
  }
  addBookMarkAlert = (text) =>
  Alert.alert('즐겨찾기 추가', '선택하신 공지사항을 즐겨찾기에 추가하시겠습니까?', [
    {
      text: 'Cancel',
      style: 'cancel',
    },
    {text: 'OK', onPress: () => addBookMark(text)},
  ]);
  delBookMarkAlert = (key) =>
  Alert.alert('즐겨찾기 삭제', '선택하신 공지사항을 즐겨찾기에서 삭제하시겠습니까?', [
    {
      text: 'Cancel',
      style: 'cancel',
    },
    {text: 'OK', onPress: () => {deleteBookMark(key)}},
  ]);  
  useEffect(() => {
    loadBookMarks();
  }, []);

  const loadTags = async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYWORD);
      json !== null ? setTags(JSON.parse(json)) : null;
    } catch (e) {
      Alert.alert(e);
    }
  };
  useFocusEffect(
    React.useCallback(() => {
      loadTags();
    }, [])
  );
  useEffect(() => {
    setTaggedNotices(FindWithTags(allNotices, tags));
  }, [tags, allNotices]);

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <View style={{paddingLeft:70}}></View>
        <Pressable onPress={initKeyword}><Text style={styles.topTitle}>Pnu</Text></Pressable>
        <Pressable onPressIn={() => setPressed(1)} onPressOut={() => setPressed(0)} onPress={() => navigation.push('Alert')}>{
          (pressed==0)?
          (<Ionicons style={styles.topIcon} name="md-settings-outline" size={30} color="black" />):
          (<Ionicons style={styles.topIcon} name="md-settings-sharp" size={30} color="#63b6ea" />)
        }</Pressable>
      </View>
      <View style={styles.input}>
        <View style={styles.inputBar}>
          <Feather style={styles.inputIcon} name="search" size={24} color="#a2dbff" />
          <TextInput
            style={styles.inputText}
            value={keyword}
            onChangeText={changeKeyword}
            onSubmitEditing={search}
            placeholder={'검색어를 입력하세요.'}
          />
        </View>
      </View>
      <View style={styles.list}>
        <Text style={styles.listTitle}>{page === 0 ? ("공지사항") : ("즐겨찾기")}</Text>
        <ScrollView style={styles.listContents} showsVerticalScrollIndicator={false}>
          { page === 0 ? (notices.length === 0 ?  (
            <ActivityIndicator color="#63b6ea" size="large" style={{marginTop: 200}}/>
          ): (notices.map((notice, index) => 
            <Item
              key={index}
              title={notice.title}
              author={notice.author}
              date={notice.date}
              link={notice.link}
              tagged={taggedNotices.includes(notice)}
              marked={true}
            />
          ))) : (Object.keys(bookmarks).length === 0 ?  (
            <View style={{justifyContent:'center', alignItems:'center', marginTop:100}}>
              <AntDesign name="aliwangwang-o1" size={50} color="black" style={{margin:10, color:'#555'}} />
              <Text style={{color:'#555'}}>공지사항을 길게 눌러 추가·삭제하세요.</Text>
            </View>
          ): (Object.keys(bookmarks).map((key) =>
            <Item
              id={key}
              key={key}
              title={bookmarks[key].text.title}
              author={bookmarks[key].text.author}
              date={bookmarks[key].text.date}
              link={bookmarks[key].text.link}
              tagged={false}
              marked={false}
            />
          )))}
        </ScrollView>
      </View>
      <View style={{flex: 1, flexDirection: 'row'}}>
        <Pressable style={page===0 ? (styles.pressedBtn) : (styles.Btn)} onPress={() => {setPage(0)}}>
          <AntDesign name="notification" size={24} color={(page==0)?'white':'black'} />
          <Text style={(page==0)?{color:'white'}:{color:'black'}}>공지사항</Text>
        </Pressable>
        <Pressable style={page===1 ? (styles.pressedBtn) : (styles.Btn)} onPress={() => {setPage(1)}}>
          <AntDesign name="staro" size={24} color={(page==1)?'white':'black'} />
          <Text style={(page==1)?{color:'white'}:{color:'black'}}>즐겨찾기</Text>
        </Pressable>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 35,
    backgroundColor: 'white',
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#43a6da',
    margin: 20,
  },
  topIcon: {
    margin: 20,
  },
  input: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#aaa',
    margin: 20,
    width: SCREEN_WIDTH - 40,
  },
  inputIcon: {
    color: '#aaa',
    margin: 10,
  },
  inputText: {
    width: SCREEN_WIDTH - 100,
    height: 45,
  },
  list: {
    height: SCREEN_HEIGHT - 250,
  },
  listTitle: {
    margin: 10,
    marginLeft: 20,
    fontSize: 18, 
    fontWeight: "500",
    alignSelf: 'flex-start',
  },
  listContents: {
    backgroundColor: '#eee',
  },
  item: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 10,
  },
  itemText: {
    fontSize:16, 
    fontWeight:'500', 
    width:SCREEN_WIDTH-70,
  },
  itemTaggedText: {
    fontSize:16, 
    fontWeight:'500', 
    color:'#63b6ea', 
    width:SCREEN_WIDTH-70,
  },
  Btn: {
    width: SCREEN_WIDTH / 2,
    height: 90,
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: 'white',
  },
  pressedBtn: {
    width: SCREEN_WIDTH / 2,
    height: 90,
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor:'#63b6ea',
    color: 'white',
  },
});
