const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

class Component{
    constructor(roomId, authorId, type, properties){
        this.uuid = uuidv4();

        this.roomId = roomId;
        this.authorId = authorId;

        this.type = type;
        this.properties = properties;

        this.children = [];
    }

    HasComponentInChild(componentId)
    {
        let child = this.children.find((c) => c.uuid === componentId);
        
        if (!child)
        {
            this.children.forEach(c => {
                child = c.HasComponentInChildren(componentId);
                if (child){
                    return child;
                }
            });
        }

        return child;
    }
}

class Room{
    constructor(ownerId, name, isPublic, password)
    {
        this.uuid = uuidv4();

        this.ownerId = ownerId;
        this.name = name;
        this.isPublic = isPublic;
        this.password = password;

        this.defaultPermissionLevel = 1; // Не может только кикать
        this.users = []
        this.components = []
    }

    AddUser(user, overrideDefaultPermissionLevel = false)
    {
        if (user instanceof RoomUser)
        {
            if (this.HasUser(user.account.uuid))
            {
                return;
            }

            if (!overrideDefaultPermissionLevel)
                user.permission = this.defaultPermissionLevel;

            // ЛОГИКА БД
            this.users.push(user);

            return user;
        }

        if (user instanceof User){

            // Предупреждение выводится при попытке добавления пользователя типа User
            // с включёным флагом overrideDefaultPermissionLevel - тип User не поддерживает данную операцию
            // и по умолчанию будет выдан defaultPermissionLevel
            if (overrideDefaultPermissionLevel)
            {
                console.warn(`User ${user.name} tried to be added in room ${this.name} with permission override but RoomUser expected!`)
            }

            if (this.HasUser(user.uuid))
            {
                return;
            }
                

            const newUser = new RoomUser(user);
            newUser.permission = this.defaultPermissionLevel;

            // ЛОГИКА БД
            this.users.push(newUser);

            return newUser;
        }

        console.warn(`Unsupported typeof in AddUser function = ${typeof(user)}`);
        return;
    }

    RemoveUser(userId)
    {
        const userInstance = this.HasUser(userId);

        if (userInstance)
        {
            this.users.splice(this.users.indexOf(userInstance, 1));
            return userInstance;
        }

        return;
    }

    RemoveComponent(componenId)
    {
        const componentInstance = this.HasComponent(componenIdId);

        if (componentInstance)
        {
            this.components.splice(this.components.indexOf(componentInstance, 1));
            return componentInstance;
        }

        return;
    }

    HasUser(userId)
    {
        return this.users.find((user) => user.account.uuid === userId);
    }

    HasComponent(componentId)
    {
        let found = null;
        this.components.forEach((component) => {
            if(component.uuid === componentId)
            {
                return component;
            }

            found = component.HasComponentInChild(componentId);

            if(found)
            {
                return found;
            }
        })

        return;
    }
}

class RoomUser{
    constructor(userRef)
    {
        this.account = userRef;
        this.permission = 0;
    }

    IsOwner(roomId)
    {
        return this.user.ownedRooms.findOne((room) => room.ownerId === this.user.uuid);
    }
}

class User{
    constructor(name, ownedRooms)
    {
        this.name = name;
        this.uuid = uuidv4();

        this.expiresIn = new Date()
        this.expiresIn.setDate(this.expiresIn.getDate() + 1)

        this.ownedRooms = ownedRooms;
    }

    // Получить токен пользователя
    GetToken() 
    { 
        this.expiresIn.setDate(this.expiresIn.getDate() + 1)
        return jwt.sign({ sub: this.uuid }, process.env.SECRET_KEY, { expiresIn: '1d' });
    }
}

class UserStorage{
    constructor(){
        this._content = {}
    }

}

module.exports = { Room, RoomUser, Component, User }