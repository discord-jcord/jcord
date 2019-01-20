// Type definitions for jcord
// Definitions by:
// boltxyz <bolt8bp@gmail.com> (https://github.com/boltxyz)
// License: MIT

declare module 'jcord' {
  import { EventEmitter } from 'events';
  import { Stream, Readable, Writable } from 'stream';
  import { promises } from 'fs';
  export const version: string;

  // Classes
  export class Client extends EventEmitter {
    constructor(options?: object);
    public gatewayURL: string;
    public shardCount: string;
    public firstShardSent: boolean;
    public getAllMembers: boolean;
    public storeMessages: boolean;
    public token: null;
    public users: Store<string, User>;
    public guilds: Store<string, Guild>;
    public channels: Store<string, Channel>;
    private rest: object;
    public readonly uptime: number;
    public initiate(token?: string): void;
    public createMessage(channel: string, content: string): Message;
    public createDM(user: string): Promise<DMChannel>
    public getUser(user: string): Promise<User>;
    public leaveGuild(guild: string): Promise<boolean>;
    public createEmbed(channel: string, embed: MessageEmbed): Promise<Message>;
    public createMessage(channel: string, content: string): Promise<Message>;
  }

  export class CommandCreator extends Client {
    constructor(options?: object);
    public showWarnings: boolean;
    private _commands: Store<string , object> | null;
    public defaultPrefix: string;
    public owners: Array<string>;
    public customPrefix: boolean;
    public addOwner(owner: string): Array<string>;
    public removeOwner(owner: string): boolean;
    public deleteCommand(name: string): void;
    public registerGuildPrefix(guild: string, prefix: string): boolean;
    public registerCommand(name: string, reply: string | Array<string> | object | Function ): object;
  }

  export class Channel {}
  export class CategoryChannel {}
  export class Role {}
  export class TextChannel {}
  export class VoiceChannel {}
  export class Guild {}
  export class GuildChannel {}
  export class DMChannel {}
  export class UnavailableGuild {}
  export class ClientUser {}
  export class BannedUser {}
  export class MessageEmbed {}

  export class Member {
    constructor(client: Client, data: object);
    public deaf: boolean;
    public guild: Guild;
    public joinedTimestamp: Date;
    public muted: boolean;
    public nick: string | null;
  }

  export class Message {
    constructor(client: Client, data: object);
    public id: string;
    public createdTimestamp: number;
    public editedTimestamp: number;
    public content: string;
    public author: User;
    public channel: Channel;
    public type: CHANNEL_TYPES;
    public readonly member: Member | null;
    public mentionedEveryone: boolean;
    public pinned: boolean;
    public tts: boolean;
  }

  export class Store<K, V> extends Map<K, V> {
    public delete(K: K): boolean;
    public filter(func: (V: V, K: K) => boolean): Array<Object>;
    public find(func: (V: V, K: K) => boolean): V;
    public KArray(): V[];
    public map<T>(func: (V: V, K: K) => T): T[];
    public random(): V | undefined;
    public set(key: K, value: V): this;
  }

  export class User {
    constructor(client: Client, data: object);
    public avatar: string;
    public avatarURL: string;
    public bot: boolean;
    public discriminator: string;
    public id: string;
    public tag: string;
    public username: string;
    public createDM(): Promise<DMChannel>;
    public createMessage(content: string): Promise<Message>;
    public createEmbed(embed: MessageEmbed): Promise<Message>;
    public toString(): string;
  }

  // Typedefs
  type CHANNEL_TYPES = 'text' | 'dm' | 'voice' | 'groupdm' | 'category';
}
