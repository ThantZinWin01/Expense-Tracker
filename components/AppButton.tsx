import { Pressable, StyleSheet, Text, ViewStyle, StyleProp } from "react-native";

type Props = {
    title: string;
    onPress: () => void | Promise<void>; 
    style?: StyleProp<ViewStyle>;       
};

export default function AppButton({ title, onPress, style }: Props) {
    return (
        <Pressable 
            style={({ pressed }) => [
                styles.button, 
                style, 
                pressed && styles.pressed
            ]} 
            onPress={onPress}
        >
            <Text style={styles.text}>{title}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({

    button: {
        backgroundColor: "#6366f1", 
        padding: 16,
        borderRadius: 16,         
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#6366f1",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },

    text: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.5,
    },

    pressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    
});