import React, { useState, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView, Image, Alert } from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import Constants from 'expo-constants';
import MapView, { Marker } from 'react-native-maps';
import { SvgUri } from 'react-native-svg';
import * as Location from 'expo-location';
import api from '../../services/api';

interface Item {
    id: number,
    name: string,
    image_url: string
};

interface Point {
    id: number,
    name: string,
    image: string,
    image_url: string,
    latitude: number,
    longitude: number
};

interface Params {
    uf: string,
    city: string
}

const Points = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [points, setPoints] = useState<Point[]>([]);
    const [selectItems, setSelectItems] = useState<number[]>([]);
    const navigator = useNavigation();
    const [initalPosition, setInitalPosition] = useState<[number, number]>([0, 0]);
    const route = useRoute();
    const routeParams = route.params as Params;

    useEffect(() => {
        api.get("/items").then(respose => {
            setItems(respose.data);
        })
    }, []);

    useEffect(() => {
        async function loadPosition() {
            const { status } = await Location.requestPermissionsAsync();

            if (status !== "granted") {
                Alert.alert("Oooops...", "Precisamos da sua permissão para abter a localização");
                return;
            }

            const location = await Location.getCurrentPositionAsync();

            const { latitude, longitude } = location.coords;

            setInitalPosition([
                latitude,
                longitude
            ]);
        }

        loadPosition();
    }, []);

    useEffect(() => {
        api.get("points", {
            params: {
                city: routeParams.city,
                uf: routeParams.uf,
                items: selectItems
            }
        }).then(respose => {
            setPoints(respose.data);
        })
    }, [selectItems]);

    function handlerNavigationBack() {
        navigator.goBack();
    }

    function handlerNavigationToDetail(id: number) {
        navigator.navigate("Detail", { point_id: id });
    }

    function handlerSelectItem(id: number) {
        const alreadySelected = selectItems.findIndex((item) => item === id);

        if (alreadySelected >= 0) {
            const filteredItems = selectItems.filter((item) => item !== id);

            setSelectItems(filteredItems);
        }
        else {
            setSelectItems([...selectItems, id]);
        }
    }

    return (
        <>
            <View style={styles.container}>
                <TouchableOpacity onPress={handlerNavigationBack}>
                    <Icon name="arrow-left" color="#fff" size={24} />
                </TouchableOpacity>

                <Text style={styles.title}>Bem Vindo</Text>
                <Text style={styles.description}>Encontre no mapa um ponto de coleta.</Text>

                <View style={styles.mapContainer}>
                    {
                        initalPosition[0] !== 0 && (
                            <MapView
                                style={styles.map}
                                initialRegion={{
                                    latitude: initalPosition[0],
                                    longitude: initalPosition[1],
                                    latitudeDelta: 0.014,
                                    longitudeDelta: 0.014
                                }}>
                                {
                                    points.map(item => (
                                        <Marker
                                            key={String(item.id)}
                                            onPress={() => handlerNavigationToDetail(item.id)}
                                            style={styles.mapMarker}
                                            coordinate={{
                                                latitude: item.latitude,
                                                longitude: item.longitude
                                            }}
                                        >
                                            <View style={styles.mapMarkerContainer}>
                                                <Image style={styles.mapMarkerImage} source={{ uri: item.image_url }} />
                                                <Text style={styles.mapMarkerTitle}>{item.name}</Text>
                                            </View>
                                        </Marker>
                                    ))
                                }
                            </MapView>
                        )
                    }
                </View>
            </View>
            <View style={styles.itemsContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 28 }}
                >
                    {
                        items.map(item => (
                            <TouchableOpacity
                                key={String(item.id)}
                                style={[styles.item, selectItems.includes(item.id) ? styles.selectedItem : {}]}
                                activeOpacity={0.6}
                                onPress={() => handlerSelectItem(item.id)}>
                                <SvgUri width={47} height={47} uri={item.image_url} />
                                <Text style={styles.itemTitle}>{item.name}</Text>
                            </TouchableOpacity>
                        ))
                    }
                </ScrollView>
            </View>
        </>
    )
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 32,
        paddingTop: 20 + Constants.statusBarHeight,
    },

    title: {
        fontSize: 20,
        fontFamily: 'Ubuntu_700Bold',
        marginTop: 24,
    },

    description: {
        color: '#6C6C80',
        fontSize: 16,
        marginTop: 4,
        fontFamily: 'Roboto_400Regular',
    },

    mapContainer: {
        flex: 1,
        width: '100%',
        borderRadius: 10,
        overflow: 'hidden',
        marginTop: 16,
    },

    map: {
        width: '100%',
        height: '100%',
    },

    mapMarker: {
        width: 90,
        height: 80,
    },

    mapMarkerContainer: {
        width: 90,
        height: 70,
        backgroundColor: '#34CB79',
        flexDirection: 'column',
        borderRadius: 8,
        overflow: 'hidden',
        alignItems: 'center'
    },

    mapMarkerImage: {
        width: 90,
        height: 45,
        resizeMode: 'cover',
    },

    mapMarkerTitle: {
        flex: 1,
        fontFamily: 'Roboto_400Regular',
        color: '#FFF',
        fontSize: 13,
        lineHeight: 23,
    },

    itemsContainer: {
        flexDirection: 'row',
        marginTop: 16,
        marginBottom: 32,
    },

    item: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#eee',
        height: 120,
        width: 120,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 16,
        marginRight: 8,
        alignItems: 'center',
        justifyContent: 'space-between',

        textAlign: 'center',
    },

    selectedItem: {
        borderColor: '#34CB79',
        borderWidth: 2,
    },

    itemTitle: {
        fontFamily: 'Roboto_400Regular',
        textAlign: 'center',
        fontSize: 13,
    },
});

export default Points;